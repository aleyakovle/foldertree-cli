// __tests__/FolderStructureManager.test.js
const { FolderStructureManager } = require('../index');
const fs = require('fs');
const path = require('path');

describe('FolderStructureManager', () => {
    let manager;
    const testDir = path.join(__dirname, 'test-output');
    const testInputFile = path.join(__dirname, 'test-structure.txt');

    beforeEach(() => {
        manager = new FolderStructureManager();
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir);
        }
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        if (fs.existsSync(testInputFile)) {
            fs.unlinkSync(testInputFile);
        }
    });

    describe('createStructureFromFile', () => {
        test('should create basic folder structure', () => {
            const structure =
`├── folder1/
│   ├── file1.txt
│   └── file2.txt
└── folder2/
    └── subfolder/
        └── file3.txt`;
            fs.writeFileSync(testInputFile, structure);

            manager.createStructureFromFile(testInputFile, testDir);

            expect(fs.existsSync(path.join(testDir, 'folder1'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder1', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder1', 'file2.txt'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder2'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder2', 'subfolder'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder2', 'subfolder', 'file3.txt'))).toBe(true);
        });

        test('should handle empty lines and separator lines', () => {
            const structure =
`├── folder1/
│
│   ├── file1.txt
│
└── folder2/`;
            fs.writeFileSync(testInputFile, structure);

            manager.createStructureFromFile(testInputFile, testDir);

            expect(fs.existsSync(path.join(testDir, 'folder1'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder1', 'file1.txt'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'folder2'))).toBe(true);
        });

        test('should handle error cases', () => {
            // Test with non-existent input file
            expect(() => {
                manager.createStructureFromFile('non-existent-file.txt', testDir);
            }).toThrow(/ENOENT/);

            // Test with invalid structure format
            const invalidStructure =
`invalid format
no tree characters`;
            fs.writeFileSync(testInputFile, invalidStructure);

            expect(() => {
                manager.createStructureFromFile(testInputFile, testDir);
            }).toThrow(/Invalid characters/);
        });

        test('should handle complex nested structure', () => {
            const structure =
`├── api/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py
│       └── routes/
│           ├── __init__.py
│           └── auth.py`;
            fs.writeFileSync(testInputFile, structure);

            manager.createStructureFromFile(testInputFile, testDir);

            expect(fs.existsSync(path.join(testDir, 'api'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'Dockerfile'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'requirements.txt'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', '__init__.py'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', 'models'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', 'models', '__init__.py'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', 'models', 'user.py'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', 'routes'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', 'routes', '__init__.py'))).toBe(true);
            expect(fs.existsSync(path.join(testDir, 'api', 'app', 'routes', 'auth.py'))).toBe(true);
        });
    });

    describe('generateStructureText', () => {
        test('should generate correct structure text', () => {
            // Create test structure
            fs.mkdirSync(path.join(testDir, 'folder1'));
            fs.writeFileSync(path.join(testDir, 'folder1', 'file1.txt'), '');
            fs.mkdirSync(path.join(testDir, 'folder2'));
            fs.mkdirSync(path.join(testDir, 'folder2', 'subfolder'));
            fs.writeFileSync(path.join(testDir, 'folder2', 'subfolder', 'file2.txt'), '');

            const outputFile = path.join(testDir, 'output-structure.txt');
            manager.generateStructureText(testDir, outputFile);

            const content = fs.readFileSync(outputFile, 'utf8');
            expect(content).toContain('folder1/');
            expect(content).toContain('file1.txt');
            expect(content).toContain('folder2/');
            expect(content).toContain('subfolder/');
            expect(content).toContain('file2.txt');
            expect(content).toMatch(/├──|└──/); // Should contain tree characters
        });

        test('should handle empty directory', () => {
            const outputFile = path.join(testDir, 'output-structure.txt');
            manager.generateStructureText(testDir, outputFile);

            const content = fs.readFileSync(outputFile, 'utf8');
            expect(content.trim()).toBe(''); // Empty directory should result in empty output
        });
    });
});
