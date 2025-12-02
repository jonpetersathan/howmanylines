'use client';

import { FileCode, Code2, Hash, FileText } from 'lucide-react';
import {
    SiJavascript, SiTypescript, SiPython, SiC, SiCplusplus,
    SiGo, SiRust, SiRuby, SiPhp, SiHtml5, SiCss3, SiSass, SiLess, SiJson,
    SiYaml, SiXml, SiMysql, SiGnubash, SiDocker, SiMarkdown, SiDart,
    SiKotlin, SiSwift, SiVuedotjs, SiSvelte, SiLua, SiPerl, SiR, SiElixir,
    SiHaskell, SiScala, SiSolidity, SiLatex
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa';
import { TbBrandCSharp } from 'react-icons/tb';
import { VscFileCode, VscTerminalPowershell } from 'react-icons/vsc';

import { LANGUAGE_TO_CATEGORY } from '@/lib/constants';

interface StatsDisplayProps {
    stats: Record<string, number>;
    totalLines: number;
}

export function StatsDisplay({ stats, totalLines }: StatsDisplayProps) {
    const sortedStats = Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .filter(([, lines]) => (lines / totalLines) * 100 >= 0.1);

    const getCategory = (language: string): string => {
        return LANGUAGE_TO_CATEGORY[language] || 'Other';
    };

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            'Code': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'Config': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            'Docs': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        };
        return colors[category] || colors['Other'];
    };

    const getLanguageIcon = (language: string) => {
        const icons: Record<string, React.ElementType> = {
            'JavaScript': SiJavascript,
            'TypeScript': SiTypescript,
            'Python': SiPython,
            'Java': FaJava,
            'C': SiC,
            'C++': SiCplusplus,
            'C/C++ Header': SiCplusplus, // Use C++ icon for headers
            'C#': TbBrandCSharp,
            'Go': SiGo,
            'Rust': SiRust,
            'Ruby': SiRuby,
            'PHP': SiPhp,
            'HTML': SiHtml5,
            'CSS': SiCss3,
            'SCSS': SiSass,
            'Sass': SiSass,
            'Less': SiLess,
            'JSON': SiJson,
            'YAML': SiYaml,
            'XML': SiXml,
            'SQL': SiMysql,
            'Shell': SiGnubash,
            'Batch': VscFileCode,
            'PowerShell': VscTerminalPowershell,
            'Dockerfile': SiDocker,
            'Markdown': SiMarkdown,
            'Dart': SiDart,
            'Text': FileText,
            'Word Document': FileText,
            'Kotlin': SiKotlin,
            'Swift': SiSwift,
            'Vue': SiVuedotjs,
            'Svelte': SiSvelte,
            'Lua': SiLua,
            'Perl': SiPerl,
            'R': SiR,
            'Elixir': SiElixir,
            'Haskell': SiHaskell,
            'Scala': SiScala,
            'Solidity': SiSolidity,
            'TOML': FileCode,
            'INI': FileCode,
            'Gradle': SiGnubash, // Using shell icon as fallback/close match
            'reStructuredText': FileText,
            'LaTeX': SiLatex,
            'Config': FileCode, // Generic config
        };
        return icons[language] || FileCode;
    };

    const totalCodeLines = Object.entries(stats).reduce((acc, [language, lines]) => {
        return getCategory(language) === 'Code' ? acc + lines : acc;
    }, 0);

    const totalConfigLines = Object.entries(stats).reduce((acc, [language, lines]) => {
        return getCategory(language) === 'Config' ? acc + lines : acc;
    }, 0);

    const totalDocsLines = Object.entries(stats).reduce((acc, [language, lines]) => {
        return getCategory(language) === 'Docs' ? acc + lines : acc;
    }, 0);

    const categoriesData = [
        {
            label: 'Lines of Code',
            count: totalCodeLines,
            icon: Code2,
            color: 'text-blue-400',
            bgGradient: 'from-blue-500/10 to-cyan-500/10',
            textGradient: 'from-blue-400 to-cyan-400'
        },
        {
            label: 'Lines of Config',
            count: totalConfigLines,
            icon: FileCode,
            color: 'text-yellow-400',
            bgGradient: 'from-yellow-500/10 to-orange-500/10',
            textGradient: 'from-yellow-400 to-orange-400'
        },
        {
            label: 'Lines of Docs',
            count: totalDocsLines,
            icon: FileText,
            color: 'text-green-400',
            bgGradient: 'from-green-500/10 to-emerald-500/10',
            textGradient: 'from-green-400 to-emerald-400'
        }
    ].sort((a, b) => b.count - a.count);

    return (
        <div className="w-full max-w-6xl mx-auto mt-12 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {/* Total Lines Card */}
                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Hash className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1 text-sm">Total Lines</h3>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            {totalLines.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Dynamic Category Cards */}
                {categoriesData.map((category) => (
                    <div key={category.label} className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="relative flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                                <category.icon className={`w-6 h-6 ${category.color}`} />
                            </div>
                            <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1 text-sm">{category.label}</h3>
                            <p className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${category.textGradient}`}>
                                {category.count.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
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
                        const Icon = getLanguageIcon(language);

                        return (
                            <div
                                key={language}
                                className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center justify-between mb-2 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                            <Icon className="w-4 h-4" />
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
