# Foldertree CLI

Create and document folder structures using tree diagrams.

## Quick Start

```bash
# Install globally
npm install -g foldertree-cli

# Create folders from a tree diagram
foldertree-cli create structure.txt my-project

# Generate a tree diagram from folders
foldertree-cli generate my-project output.txt
```

### What It Does

#### This tool helps you:
* Create folder structures from tree diagrams
* Generate tree diagrams from existing folders

#### Perfect for:
* Project templates
* Documentation
* Sharing folder layouts
* Quick project setup

### Tree Format Example
```text
├── src/
│   ├── components/
│   │   └── App.js
│   └── index.js
└── README.md
```

### Usage:
```
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
```

### Features
* Validates tree diagram format
* Handles nested structures
* Creates empty files automatically
* Works cross-platform
* Clear error messages
