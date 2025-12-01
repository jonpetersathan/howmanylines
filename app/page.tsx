'use client';

import { useState } from 'react';
import { RepoInput } from '@/components/RepoInput';
import { StatsDisplay } from '@/components/StatsDisplay';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Github } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [totalLines, setTotalLines] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setStats(null);
    setTotalLines(0);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      setStats(data.stats);
      setTotalLines(data.totalLines);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white selection:bg-purple-500/30 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-gray-900/50 rounded-2xl mb-6 border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-xl">
            <Github className="w-8 h-8 text-gray-900 dark:text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            How Many <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Lines?</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Analyze any public Git repository and discover the code composition.
            Visualize line counts by language in seconds.
          </p>
        </div>

        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <RepoInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {error && (
          <div className="max-w-xl mx-auto mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center animate-fade-in-up">
            {error}
          </div>
        )}

        {stats && (
          <StatsDisplay stats={stats} totalLines={totalLines} />
        )}
      </div>
    </main>
  );
}
