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

const MAX_FILE_SIZE_BYTES = process.env.MAX_FILE_SIZE
  ? parseInt(process.env.MAX_FILE_SIZE, 10) * 1024 // KB to Bytes
  : 1024 * 1024 * 1; // 1MB

const MAX_REPO_SIZE_BYTES = process.env.MAX_REPO_SIZE
  ? parseInt(process.env.MAX_REPO_SIZE, 10) * 1024 // KB to Bytes
  : 100 * 1024 * 1024; // 100MB

class RepoTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepoTooLargeError';
  }
}

export async function POST(request: Request) {
  console.log('Received POST request to /api/analyze');
  let tempDir = '';
  let repoUrl: string | undefined;
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
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-line-counter-'));

    // Clone the repository
    console.log(`Cloning ${repoUrl} to ${tempDir}...`);

    const controller = new AbortController();
    const { signal } = controller;
    let totalBytesDownloaded = 0;

    const customHttp = {
      ...http,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: async (args: any) => {
        const response = await http.request({ ...args, signal });
        if (response.body) {
          const originalBody = response.body;
          const wrappedBody = (async function* () {
            for await (const chunk of originalBody) {
              totalBytesDownloaded += chunk.length;
              if (totalBytesDownloaded > MAX_REPO_SIZE_BYTES) {
                controller.abort();
                throw new RepoTooLargeError(`Repository too large. Limit is ${(MAX_REPO_SIZE_BYTES / 1024 / 1024).toFixed(2)}MB`);
              }
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
          // 3. Resource Limits (DoS Protection)
          if (stat.size > MAX_FILE_SIZE_BYTES) {
            console.warn(`Skipping large file ${filePath} (${stat.size} bytes)`);
            return;
          }

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
    await cache.set(cacheKey, result);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error processing repository:', error);

    // Handle RepoTooLargeError specifically
    if (error instanceof RepoTooLargeError || (error instanceof Error && error.name === 'RepoTooLargeError') || (error instanceof Error && error.name === 'AbortError')) {
      const errorMessage = error instanceof Error ? error.message : 'Repository too large';

      // Attempt to cache the error if we can parse the URL again (safe fallback)
      try {
        if (repoUrl) {
          const cacheKey = `repo:${repoUrl}`;
          await cache.set(cacheKey, { error: errorMessage });
        }
      } catch (e) {
        console.error('Failed to cache error state:', e);
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to process repository';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
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
