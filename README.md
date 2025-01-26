# Foldertree CLI

A command-line tool for creating and documenting folder structures using tree diagrams.
Transform tree diagrams into real folders and generate folder structure visualizations

## Features

- 🚀 Create folder structures from tree diagram text files
- 📝 Generate tree diagrams from existing folders
- ✅ Validate tree diagram format
- 🌳 Support for deeply nested structures
- 💪 Robust error handling

## Installation

[![npm version](https://img.shields.io/npm/v/foldertree-cli.svg)](https://www.npmjs.com/package/foldertree-cli)
[![npm downloads](https://img.shields.io/npm/dm/foldertree-cli.svg)](https://www.npmjs.com/package/foldertree-cli)
[![npm license](https://img.shields.io/npm/l/foldertree-cli.svg)](https://www.npmjs.com/package/foldertree-cli)

```bash
npm install -g foldertree-cli
```

### Creating Folders from Tree Diagram

1. Create a text file (e.g., `structure.txt`) with your desired folder structure:

```text
├── docs/
│   ├── guide.md
│   └── api.md
└── src/
    ├── components/
    │   └── Button.js
    └── index.js
```

2. Run the `create` command (file structure from input file):

```bash
foldertree-cli create structure.txt my-project
```

### Generating Tree Diagram

Generate a tree diagram from an existing folder

```bash
foldertree-cli generate my-project output.txt
```

## ❗To hide system files or to include `.gitignore` rules, [check the section below](#usage-guide).

### Tree Diagram Format

* Use ├── for items that have siblings below them
* Use └── for the last item in a group
* Use │ for vertical lines
* Add / at the end of folder names
* Indent using spaces (4 spaces or 1 tab)


## usage-guide

<details> <summary>CLI help</summary>

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
</details>
