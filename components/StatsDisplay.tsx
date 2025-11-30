'use client';

import { FileCode, Code2, Hash } from 'lucide-react';

interface StatsDisplayProps {
    stats: Record<string, number>;
    totalLines: number;
}

export function StatsDisplay({ stats, totalLines }: StatsDisplayProps) {
    const sortedStats = Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .filter(([, lines]) => (lines / totalLines) * 100 >= 0.5);

    const getCategory = (language: string): string => {
        const categories: Record<string, string> = {
            'JavaScript': 'Code',
            'TypeScript': 'Code',
            'Python': 'Code',
            'Java': 'Code',
            'C': 'Code',
            'C++': 'Code',
            'C#': 'Code',
            'Go': 'Code',
            'Rust': 'Code',
            'Ruby': 'Code',
            'PHP': 'Code',
            'HTML': 'Code',
            'CSS': 'Code',
            'SCSS': 'Code',
            'Sass': 'Code',
            'Less': 'Code',
            'JSON': 'Config',
            'YAML': 'Config',
            'XML': 'Config',
            'SQL': 'Code',
            'Shell': 'Script',
            'Batch': 'Script',
            'PowerShell': 'Script',
            'Dockerfile': 'Config',
            'Markdown': 'Docs',
        };
        return categories[language] || 'Other';
    };

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            'Code': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'Config': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            'Docs': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            'Script': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        };
        return colors[category] || colors['Other'];
    };

    const totalCodeLines = Object.entries(stats).reduce((acc, [language, lines]) => {
        return getCategory(language) === 'Code' ? acc + lines : acc;
    }, 0);

    const totalConfigLines = Object.entries(stats).reduce((acc, [language, lines]) => {
        return getCategory(language) === 'Config' ? acc + lines : acc;
    }, 0);

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Lines Card */}
                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Hash className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1 text-sm">Total Lines</h3>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            {totalLines.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Total Code Lines Card */}
                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Code2 className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1 text-sm">Lines of Code</h3>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                            {totalCodeLines.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Total Config Lines Card */}
                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <FileCode className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1 text-sm">Lines of Config</h3>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                            {totalConfigLines.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-purple-400" />
                    Language Breakdown
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    {sortedStats.map(([language, lines], index) => {
                        const percentage = ((lines / totalLines) * 100).toFixed(1);
                        const category = getCategory(language);
                        return (
                            <div
                                key={language}
                                className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center justify-between mb-2 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                            <FileCode className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-200 block">{language}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getCategoryColor(category)}`}>
                                                {category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-gray-900 dark:text-white">{lines.toLocaleString()}</span>
                                        <span className="text-sm text-gray-500">{percentage}%</span>
                                    </div>
                                </div>

                                {/* Progress Bar Background */}
                                <div className="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full rounded-b-xl overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
