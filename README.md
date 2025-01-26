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

```bash
npm install -g foldertree-cli
```

## Usage
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

### Tree Diagram Format

* Use ├── for items that have siblings below them
* Use └── for the last item in a group
* Use │ for vertical lines
* Add / at the end of folder names
* Indent using spaces (4 spaces or 1 tab)
