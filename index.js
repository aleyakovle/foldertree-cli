#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

const DEFAULT_IGNORED_PATTERNS = [
    // Version Control
    '.git/**',
    '.svn/**',
    '.hg/**',
    '.bzr/**',

    // Dependencies
    'node_modules/**',
    'bower_components/**',
    'vendor/**',

    // IDE and Editor files
    '.idea/**',
    '.vscode/**',
    '.vs/**',
    '*.sublime-*',

    // Build and Cache
    'dist/**',
    'build/**',
    'out/**',
    '.cache/**',
    '.tmp/**',
    '.temp/**',

    // OS files
    '.DS_Store',
    'Thumbs.db',

    // Log files
    '*.log',
    'logs/**',

    // Coverage reports
    'coverage/**',
    '.nyc_output/**',

    // Environment and secrets
    '.env*',
    '.env.local',
    '.env.*.local',

    // Additional common ignores
    '*.pyc',
    '__pycache__/**',
    '.sass-cache/**',
    '.next/**',
    '.nuxt/**',
    '.serverless/**',
    '.webpack/**',
    '.parcel-cache/**'
];

class StructureValidator {
    static VALID_LINE_PATTERNS = {
        EMPTY: /^$/,
        SEPARATOR: /^[\s│]*$/,
        FILE_OR_DIR: /^[\s│]*(?:├──|└──)\s+[\w\-\.\/]+$/
    };

    static ERROR_MESSAGES = {
        INVALID_LINE: 'Invalid line format',
        INVALID_INDENTATION: 'Invalid indentation',
        INVALID_CHARACTERS: 'Invalid characters between separator and tree symbol',
        MISSING_TREE_CHAR: 'Missing tree character (├── or └──)',
        EMPTY_FILE: 'Input file is empty',
        INVALID_FILE_START: 'File must start with a valid entry (├── or └──)',
        INCONSISTENT_INDENTATION: 'Inconsistent indentation level'
    };

    validateFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
            throw new Error(StructureValidator.ERROR_MESSAGES.EMPTY_FILE);
        }

        const errors = [];
        let previousIndentLevel = 0;

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmedLine = line.trimRight();

            if (this.isEmptyOrSeparatorLine(trimmedLine)) {
                return;
            }

            // Check for invalid characters between separator and tree symbol
            const separatorMatch = trimmedLine.match(/^[\s│]*/);
            const afterSeparator = trimmedLine.slice(separatorMatch[0].length);
            if (!afterSeparator.startsWith('├──') && !afterSeparator.startsWith('└──')) {
                errors.push(`Line ${lineNumber}: ${StructureValidator.ERROR_MESSAGES.INVALID_CHARACTERS}`);
                return;
            }

            const validationError = this.validateLine(trimmedLine, previousIndentLevel, lineNumber);
            if (validationError) {
                errors.push(`Line ${lineNumber}: ${validationError}`);
            }

            previousIndentLevel = this.getIndentationLevel(trimmedLine);
        });

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        return true;
    }

    isEmptyOrSeparatorLine(line) {
        return StructureValidator.VALID_LINE_PATTERNS.EMPTY.test(line) ||
               StructureValidator.VALID_LINE_PATTERNS.SEPARATOR.test(line);
    }

    validateLine(line, previousIndentLevel, lineNumber) {
        if (!StructureValidator.VALID_LINE_PATTERNS.FILE_OR_DIR.test(line)) {
            return StructureValidator.ERROR_MESSAGES.INVALID_LINE;
        }

        const currentIndentLevel = this.getIndentationLevel(line);
        if (currentIndentLevel > previousIndentLevel + 1) {
            return StructureValidator.ERROR_MESSAGES.INCONSISTENT_INDENTATION;
        }

        return null;
    }

    getIndentationLevel(line) {
        const match = line.match(/^[\s│]*/);
        return match ? Math.floor(match[0].length / 4) : 0;
    }
}

class FolderStructureManager {
    constructor(options = {}) {
        this.validator = new StructureValidator();
        this.ignoreRules = ignore();
        this.includeHidden = options.includeHidden || false;

        // Always initialize with default ignores unless explicitly included
        if (!this.includeHidden) {
            this.ignoreRules.add(DEFAULT_IGNORED_PATTERNS);
        }
    }

    loadIgnoreRules(gitignorePath) {
        try {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            this.ignoreRules.add(gitignoreContent);
        } catch (error) {
            // silently continue if no valid .gitignore
            // console.error('Error loading .gitignore:', error);
        }
    }

    // Creates actual folders and files from structure file
    createStructureFromFile(inputFile, targetDir) {
        // Validate file before processing
        try {
            this.validator.validateFile(inputFile);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`ENOENT: no such file or directory, open '${inputFile}'`);
            }
            throw error;
        }

        const content = fs.readFileSync(inputFile, 'utf8');
        const lines = content.split('\n');

        // Create target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Stack to keep track of current path components and their levels
        let pathStack = [];

        lines.forEach((line) => {
            // Skip empty lines or lines containing only │
            if (!line.trim() || line.trim() === '│') return;

            // Count leading spaces and │ characters to determine level
            const leadingChars = line.match(/^[\s│]*/)[0];
            const level = Math.floor((leadingChars.match(/\s/g) || []).length / 2);

            // Extract the actual name (remove tree characters ├── or └── and trim)
            const name = line.replace(/^[\s│]*(?:├──|└──)\s*/, '').trim();
            if (!name) return;

            // Pop items from stack until we reach the parent level
            while (pathStack.length > 0 && pathStack[pathStack.length - 1].level >= level) {
                pathStack.pop();
            }

            // Add current item to stack
            pathStack.push({ name, level });

            // Create the full path from stack items
            const pathComponents = pathStack.map(item => item.name);
            const fullPath = path.join(targetDir, ...pathComponents);

            try {
                if (name.endsWith('/')) {
                    // It's a directory - remove trailing slash for creation
                    const dirPath = fullPath.slice(0, -1);
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }
                } else {
                    // Ensure parent directory exists
                    const parentDir = path.dirname(fullPath);
                    if (!fs.existsSync(parentDir)) {
                        fs.mkdirSync(parentDir, { recursive: true });
                    }
                    // Create file if it doesn't exist
                    if (!fs.existsSync(fullPath)) {
                        fs.writeFileSync(fullPath, '');
                    }
                }
            } catch (error) {
                console.error(`Error creating ${fullPath}:`, error);
            }
        });
    }

    // Generates structure text from existing directory
    generateStructureText(directory, outputFile) {
        const structure = this.scanDirectory(directory);
        const treeText = this.generateTree(structure);
        fs.writeFileSync(outputFile, treeText);
    }

    scanDirectory(directory, relativePath = '') {
        const structure = {};
        const items = fs.readdirSync(directory);

        items.forEach(item => {
            const fullPath = path.join(directory, item);
            const itemRelativePath = path.join(relativePath, item);

            // Skip if item matches ignore rules
            if (this.ignoreRules.ignores(itemRelativePath)) {
                return;
            }

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                const subStructure = this.scanDirectory(fullPath, itemRelativePath);
                if (Object.keys(subStructure).length > 0) {
                    structure[item + '/'] = subStructure;
                }
            } else {
                structure[item] = null;
            }
        });

        return structure;
    }

    generateTree(structure, prefix = '') {
        let result = '';
        const entries = Object.entries(structure);

        entries.forEach(([key, value], index) => {
            const isLast = index === entries.length - 1;
            const connector = isLast ? '└──' : '├──';

            result += `${prefix}${connector} ${key}\n`;

            if (value !== null) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                result += this.generateTree(value, newPrefix);
            }
        });

        return result;
    }
}

// CLI handling
function showHelp() {
    console.log(`
Usage:
    foldertree-cli (create-folders|create|c) <input-file> <target-directory>
    foldertree-cli (generate-file|generate|g) <source-directory> <output-file> [options]

Commands:
    create-folders, create, c    - Create folder structure from input file
    generate-file, generate, g   - Generate structure text file from existing directory

Options:
    --ignore <gitignore-file>   - Specify a .gitignore file to exclude additional paths
    --include-hidden            - Include hidden and system folders (like .git, .vscode)

Examples:
    foldertree-cli create-folders ./structure.txt ./my-project
    foldertree-cli generate-file ./my-project ./output-structure.txt
    foldertree-cli generate-file ./my-project ./output-structure.txt --ignore ./.gitignore
    foldertree-cli generate-file ./my-project ./output-structure.txt --include-hidden
    `);
}

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        showHelp();
        process.exit(1);
    }

    const command = args[0];
    const arg1 = args[1];
    const arg2 = args[2];

    // Parse options
    const ignoreIndex = args.indexOf('--ignore');
    const gitignorePath = ignoreIndex !== -1 ? args[ignoreIndex + 1] : null;
    const includeHidden = args.includes('--include-hidden');

    const manager = new FolderStructureManager({ includeHidden });

    // Load additional ignore rules from .gitignore if provided
    if (gitignorePath) {
        manager.loadIgnoreRules(path.resolve(gitignorePath));
    }

    try {
        switch (command) {
            case 'c':
            case 'create-folders':
            case 'create':
                const inputFile = path.resolve(arg1);
                const targetDir = path.resolve(arg2);
                manager.createStructureFromFile(inputFile, targetDir);
                console.log(`Structure created successfully in ${targetDir}`);
                break;

            case 'g':
            case 'generate-file':
            case 'generate':
                const sourceDir = path.resolve(arg1);
                const outputFile = path.resolve(arg2);
                manager.generateStructureText(sourceDir, outputFile);
                console.log(`Structure file generated successfully at ${outputFile}`);
                break;

            default:
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

module.exports = { FolderStructureManager, StructureValidator };
