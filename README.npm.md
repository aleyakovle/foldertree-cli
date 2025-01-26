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

## Commands
### create

Creates folders and files from a tree diagram:

```bash
foldertree-cli create <input-file> <target-directory>
```

### generate

Creates a tree diagram from existing folders:
```bash
foldertree-cli generate <source-directory> <output-file>
```

Features
* Validates tree diagram format
* Handles nested structures
* Creates empty files automatically
* Works cross-platform
* Clear error messages
