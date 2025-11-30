'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface RepoInputProps {
    onAnalyze: (url: string) => void;
    isLoading: boolean;
}

export function RepoInput({ onAnalyze, isLoading }: RepoInputProps) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const normalizeUrl = (input: string) => {
        let normalized = input.trim();

        // Handle "username/repo" shorthand
        if (!normalized.startsWith('http') && normalized.split('/').length === 2) {
            return `https://github.com/${normalized}`;
        }

        // Handle missing protocol
        if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
            return `https://${normalized}`;
        }

        // Handle http -> https
        if (normalized.startsWith('http://')) {
            return normalized.replace('http://', 'https://');
        }

        return normalized;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!url.trim()) {
            setError('Please enter a repository URL');
            return;
        }

        const normalizedUrl = normalizeUrl(url);

        try {
            new URL(normalizedUrl);
            onAnalyze(normalizedUrl);
        } catch {
            setError('Please enter a valid URL');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-xl p-2 border border-gray-200 dark:border-gray-800 shadow-2xl">
                    <div className="pl-4 text-gray-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 focus:outline-none text-lg"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={twMerge(
                            "px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200",
                            isLoading
                                ? "bg-gray-200 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400"
                                : "bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            "Analyze"
                        )}
                    </button>
                </div>
            </form>
            {error && (
                <p className="mt-2 text-red-400 text-sm text-center animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}
