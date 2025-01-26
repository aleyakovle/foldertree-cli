#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
    constructor() {
        this.validator = new StructureValidator();
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
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                structure[item + '/'] = this.scanDirectory(fullPath, path.join(relativePath, item));
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
    foldertree-cli (generate-file|generate|g) <source-directory> <output-file>

Commands:
    create-folders, create, c    - Create folder structure from input file
    generate-file, generate, g  - Generate structure text file from existing directory

Examples:
    foldertree-cli create-folders ./structure.txt ./my-project
    foldertree-cli generate-file ./my-project ./output-structure.txt
    `);
}

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        showHelp();
        process.exit(1);
    }

    const [command, arg1, arg2] = args;
    const manager = new FolderStructureManager();

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
