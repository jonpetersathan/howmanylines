export type LanguageCategory = 'Code' | 'Config' | 'Docs' | 'Other';

export interface LanguageDefinition {
    name: string;
    category: LanguageCategory;
}

export const EXTENSION_MAP: Record<string, LanguageDefinition> = {
    // JavaScript / TypeScript
    '.js': { name: 'JavaScript', category: 'Code' },
    '.jsx': { name: 'JavaScript', category: 'Code' },
    '.ts': { name: 'TypeScript', category: 'Code' },
    '.tsx': { name: 'TypeScript', category: 'Code' },
    '.mjs': { name: 'JavaScript', category: 'Code' },
    '.cjs': { name: 'JavaScript', category: 'Code' },

    // Python
    '.py': { name: 'Python', category: 'Code' },
    '.pyw': { name: 'Python', category: 'Code' },

    // Java
    '.java': { name: 'Java', category: 'Code' },
    '.jar': { name: 'Java', category: 'Code' }, // Often binary, but sometimes source jars? keeping simple for now

    // C / C++
    '.c': { name: 'C', category: 'Code' },
    '.cpp': { name: 'C++', category: 'Code' },
    '.cc': { name: 'C++', category: 'Code' },
    '.cxx': { name: 'C++', category: 'Code' },
    '.h': { name: 'C/C++ Header', category: 'Code' },
    '.hpp': { name: 'C/C++ Header', category: 'Code' },

    // C#
    '.cs': { name: 'C#', category: 'Code' },

    // Go
    '.go': { name: 'Go', category: 'Code' },

    // Rust
    '.rs': { name: 'Rust', category: 'Code' },

    // Ruby
    '.rb': { name: 'Ruby', category: 'Code' },
    '.erb': { name: 'Ruby', category: 'Code' },

    // PHP
    '.php': { name: 'PHP', category: 'Code' },

    // Web
    '.html': { name: 'HTML', category: 'Code' },
    '.htm': { name: 'HTML', category: 'Code' },
    '.css': { name: 'CSS', category: 'Code' },
    '.scss': { name: 'SCSS', category: 'Code' },
    '.sass': { name: 'Sass', category: 'Code' },
    '.less': { name: 'Less', category: 'Code' },
    '.vue': { name: 'Vue', category: 'Code' },
    '.svelte': { name: 'Svelte', category: 'Code' },

    // Data / Config
    '.json': { name: 'JSON', category: 'Config' },
    '.json5': { name: 'JSON', category: 'Config' },
    '.yml': { name: 'YAML', category: 'Config' },
    '.yaml': { name: 'YAML', category: 'Config' },
    '.xml': { name: 'XML', category: 'Config' },
    '.toml': { name: 'TOML', category: 'Config' },
    '.ini': { name: 'INI', category: 'Config' },
    '.env': { name: 'Config', category: 'Config' },
    '.dockerfile': { name: 'Dockerfile', category: 'Config' },
    'Dockerfile': { name: 'Dockerfile', category: 'Config' }, // Special case handling might be needed for filenames
    '.gradle': { name: 'Gradle', category: 'Config' },

    // Database
    '.sql': { name: 'SQL', category: 'Code' },

    // Shell / Scripts
    '.sh': { name: 'Shell', category: 'Code' },
    '.bash': { name: 'Shell', category: 'Code' },
    '.zsh': { name: 'Shell', category: 'Code' },
    '.bat': { name: 'Batch', category: 'Code' },
    '.cmd': { name: 'Batch', category: 'Code' },
    '.ps1': { name: 'PowerShell', category: 'Code' },

    // Docs
    '.md': { name: 'Markdown', category: 'Docs' },
    '.markdown': { name: 'Markdown', category: 'Docs' },
    '.txt': { name: 'Text', category: 'Docs' },
    '.doc': { name: 'Word Document', category: 'Docs' },
    '.docx': { name: 'Word Document', category: 'Docs' },
    '.rst': { name: 'reStructuredText', category: 'Docs' },

    // Other Languages
    '.dart': { name: 'Dart', category: 'Code' },
    '.kt': { name: 'Kotlin', category: 'Code' },
    '.kts': { name: 'Kotlin', category: 'Code' },
    '.swift': { name: 'Swift', category: 'Code' },
    '.lua': { name: 'Lua', category: 'Code' },
    '.pl': { name: 'Perl', category: 'Code' },
    '.pm': { name: 'Perl', category: 'Code' },
    '.r': { name: 'R', category: 'Code' },
    '.R': { name: 'R', category: 'Code' },
    '.ex': { name: 'Elixir', category: 'Code' },
    '.exs': { name: 'Elixir', category: 'Code' },
    '.hs': { name: 'Haskell', category: 'Code' },
    '.scala': { name: 'Scala', category: 'Code' },
    '.sol': { name: 'Solidity', category: 'Code' },
    '.tex': { name: 'LaTeX', category: 'Code' },
};

// Helper to get category by language name (for frontend display)
export const LANGUAGE_TO_CATEGORY: Record<string, string> = Object.values(EXTENSION_MAP).reduce((acc, def) => {
    acc[def.name] = def.category;
    return acc;
}, {} as Record<string, string>);
