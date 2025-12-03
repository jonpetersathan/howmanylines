import { NextResponse } from 'next/server';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { cache } from '@/lib/cache';
import { EXTENSION_MAP } from '@/lib/constants';
import { pLimit } from '@/lib/utils';

// Security Constants
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
  : ['github.com', 'gitlab.com', 'bitbucket.org'];

const CACHE_TTL_MIN_SECONDS = process.env.CACHE_TTL_MIN_SECONDS
  ? parseInt(process.env.CACHE_TTL_MIN_SECONDS, 10)
  : 86400; // 1 day

const CACHE_TTL_PER_BYTE = process.env.CACHE_TTL_PER_BYTE
  ? parseFloat(process.env.CACHE_TTL_PER_BYTE)
  : 0.01; // 10 second per 1000 bytes

const ANALYSIS_TIMEOUT_SECONDS = process.env.ANALYSIS_TIMEOUT_SECONDS
  ? parseInt(process.env.ANALYSIS_TIMEOUT_SECONDS, 10)
  : 60; // 1 minute

const CACHE_TTL_ON_TIMEOUT = process.env.CACHE_TTL_ON_TIMEOUT
  ? parseInt(process.env.CACHE_TTL_ON_TIMEOUT, 10)
  : 31536000; // 1 year


export async function POST(request: Request) {
  console.log('Received POST request to /api/analyze');
  let tempDir = '';
  let repoUrl: string | undefined;
  const controller = new AbortController();
  const { signal } = controller;

  // Set analysis timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, ANALYSIS_TIMEOUT_SECONDS * 1000);

  try {

    const body = await request.json();
    console.log('Request body:', body);
    repoUrl = body.repoUrl;

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    // 1. Strict URL Validation (SSRF Protection)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(repoUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol. Only HTTP/HTTPS are allowed.' }, { status: 400 });
    }

    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return NextResponse.json({
        error: `Domain not allowed. Supported providers: ${ALLOWED_DOMAINS.join(', ')}`
      }, { status: 400 });
    }

    // 2. Check Cache
    const cacheKey = `repo:${repoUrl}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${repoUrl}`);
      // If cached data has an error property (from previous failure), return it as an error response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((cachedData as any).error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: (cachedData as any).error }, { status: 400 });
      }
      return NextResponse.json(cachedData);
    }

    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'howmanylines-'));

    // Clone the repository
    console.log(`Cloning ${repoUrl} to ${tempDir}...`);

    // const controller = new AbortController(); // Moved to top level
    // const { signal } = controller; // Moved to top level

    let totalBytesDownloaded = 0;

    const customHttp = {
      ...http,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: async (args: any) => {
        if (signal.aborted) {
          throw new Error('AbortError');
        }
        const response = await http.request({ ...args, signal });
        if (response.body) {
          const originalBody = response.body;
          const wrappedBody = (async function* () {
            for await (const chunk of originalBody) {
              if (signal.aborted) {
                throw new Error('AbortError');
              }
              totalBytesDownloaded += chunk.length;
              yield chunk;
            }
          })();
          response.body = wrappedBody;
        }
        return response;
      }
    };

    // Helper to wrap fs promises with retry on EMFILE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapGraceful = (fn: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        if (signal.aborted) {
          throw new Error('AbortError');
        }
        let retries = 10;
        let delay = 100;
        while (true) {
          try {
            return await fn(...args);
          } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if ((error.code === 'EMFILE' || error.code === 'ENFILE') && retries > 0) {
              retries--;
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
              continue;
            }
            throw error;
          }
        }
      };
    };

    const gracefulPromises = Object.fromEntries(
      Object.entries(fs.promises).map(([key, value]) => [
        key,
        typeof value === 'function' ? wrapGraceful(value) : value
      ])
    );

    const customFs = {
      ...fs,
      symlink: async (_target: string, _path: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Mock symlink creation to avoid EPERM on Windows
        return;
      },
      promises: {
        ...gracefulPromises,
        symlink: async (_target: string, _path: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
          return;
        },
      }
    };

    await git.clone({
      fs: customFs,
      http: customHttp,
      dir: tempDir,
      url: repoUrl,
      singleBranch: true,
      depth: 1,
    });

    // Count lines
    const stats: Record<string, number> = {};
    let totalLines = 0;
    const limit = pLimit(50); // Limit concurrency to avoid EMFILE/OOM

    async function traverse(currentPath: string) {
      const files = await fs.readdir(currentPath);

      const tasks = files.map(async (file) => {
        if (file === '.git') return;

        const filePath = path.join(currentPath, file);
        // Limit stat calls
        const stat = await limit(() => fs.stat(filePath));

        if (stat.isDirectory()) {
          await traverse(filePath);
        } else if (stat.isFile()) {
          // 3. Resource Limits (DoS Protection) - Size limit removed

          const ext = path.extname(file).toLowerCase();
          let languageName = '';

          if (file === 'Dockerfile') {
            languageName = 'Dockerfile';
          } else if (EXTENSION_MAP[ext]) {
            languageName = EXTENSION_MAP[ext].name;
          } else {
            return;
          }

          await limit(async () => {
            try {
              const content = await fs.readFile(filePath, 'utf-8');
              const lines = content.split(/\r\n|\r|\n/).length;

              // Use a lock or just atomic increment (JS is single threaded for this part so it's safe)
              stats[languageName] = (stats[languageName] || 0) + lines;
              totalLines += lines;
            } catch (error) {
              console.warn(`Skipping file ${filePath}:`, error);
            }
          });
        }
      });

      await Promise.all(tasks);
    }

    await traverse(tempDir);

    const result = { stats, totalLines };

    // 4. Save to Cache
    // 4. Save to Cache with Variable TTL
    const ttl = Math.max(
      CACHE_TTL_MIN_SECONDS,
      Math.ceil(totalBytesDownloaded * CACHE_TTL_PER_BYTE)
    );
    console.log(`Caching ${repoUrl} for ${ttl} seconds (size: ${totalBytesDownloaded} bytes)`);
    await cache.set(cacheKey, result, ttl);

    return NextResponse.json(result);

  } catch (error: unknown) {
    // Handle AbortError (Timeout) specifically
    if ((error instanceof Error && error.name === 'AbortError') || (error instanceof Error && error.message === 'AbortError')) {
      const errorMessage = `Analysis timed out after ${ANALYSIS_TIMEOUT_SECONDS} seconds`;
      console.warn(`Analysis timed out for ${repoUrl}. Caching error for ${CACHE_TTL_ON_TIMEOUT} seconds.`);

      // Attempt to cache the error if we can parse the URL again (safe fallback)
      try {
        if (repoUrl) {
          const cacheKey = `repo:${repoUrl}`;
          await cache.set(cacheKey, { error: errorMessage }, CACHE_TTL_ON_TIMEOUT);
        }
      } catch (e) {
        console.error('Failed to cache error state:', e);
      }

      return NextResponse.json({ error: errorMessage }, { status: 408 }); // 408 Request Timeout
    }

    console.error('Error processing repository:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to process repository';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
    // Cleanup
    if (tempDir) {
      try {
        await fs.remove(tempDir);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp dir:', cleanupError);
      }
    }
  }
}
