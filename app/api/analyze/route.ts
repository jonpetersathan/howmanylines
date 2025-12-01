import { NextResponse } from 'next/server';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { cache } from '@/lib/cache';

// Security Constants
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
  : ['github.com', 'gitlab.com', 'bitbucket.org'];

const MAX_FILE_SIZE_BYTES = process.env.MAX_FILE_SIZE
  ? parseInt(process.env.MAX_FILE_SIZE, 10) * 1024 * 1024
  : 1024 * 1024; // 1MB

export async function POST(request: Request) {
  let tempDir = '';
  try {
    const { repoUrl } = await request.json();

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
      return NextResponse.json(cachedData);
    }

    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-line-counter-'));

    // Clone the repository
    console.log(`Cloning ${repoUrl} to ${tempDir}...`);
    await git.clone({
      fs,
      http,
      dir: tempDir,
      url: repoUrl,
      singleBranch: true,
      depth: 1,
    });

    // Count lines
    const stats: Record<string, number> = {};
    let totalLines = 0;

    async function traverse(currentPath: string) {
      const files = await fs.readdir(currentPath);

      for (const file of files) {
        if (file === '.git') continue;

        const filePath = path.join(currentPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          await traverse(filePath);
        } else if (stat.isFile()) {
          // 3. Resource Limits (DoS Protection)
          if (stat.size > MAX_FILE_SIZE_BYTES) {
            console.warn(`Skipping large file ${filePath} (${stat.size} bytes)`);
            continue;
          }

          // Check for text files (simple heuristic based on extension or content could be better, but extension is fast)
          // We'll trust extensions for now and maybe skip binary-looking ones if needed.
          // List of common binary extensions to skip
          const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.dll', '.bin', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.woff', '.woff2', '.ttf', '.eot'];
          const ext = path.extname(file).toLowerCase();

          if (binaryExtensions.includes(ext)) continue;

          try {
            // Read file content
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split(/\r\n|\r|\n/).length;

            const language = getLanguageFromExtension(ext);
            stats[language] = (stats[language] || 0) + lines;
            totalLines += lines;
          } catch (error) {
            // Likely a binary file or read error, skip
            console.warn(`Skipping file ${filePath}:`, error);
          }
        }
      }
    }

    await traverse(tempDir);

    const result = { stats, totalLines };

    // 4. Save to Cache
    await cache.set(cacheKey, result);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error processing repository:', error);
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

function getLanguageFromExtension(ext: string): string {
  const map: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C/C++ Header',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'Sass',
    '.less': 'Less',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.xml': 'XML',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.bat': 'Batch',
    '.ps1': 'PowerShell',
    '.dockerfile': 'Dockerfile',
    '': 'Unknown', // No extension
  };
  return map[ext] || `Other (${ext})`;
}
