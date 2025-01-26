const { FolderStructureManager } = require('../index');
const fs = require('fs');
const path = require('path');

describe('FolderStructureManager with ignore functionality', () => {
    let manager;
    const testDir = path.join(__dirname, 'test-structure');
    const outputFile = path.join(__dirname, 'output.txt');
    const gitignorePath = path.join(__dirname, '.gitignore');

    beforeEach(() => {
        // Create test directory structure
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        fs.mkdirSync(testDir);

        // Create a comprehensive test structure
        const dirsToCreate = [
            '.git',
            '.git/hooks',
            'node_modules/test-package',
            'src',
            'src/components',
            'dist',
            'build',
            '.vscode',
            'coverage',
            'logs'
        ];

        const filesToCreate = [
            ['.git/config', ''],
            ['node_modules/test-package/package.json', ''],
            ['src/index.js', ''],
            ['src/components/Button.js', ''],
            ['dist/bundle.js', ''],
            ['build/output.js', ''],
            ['.vscode/settings.json', ''],
            ['coverage/lcov.info', ''],
            ['logs/error.log', ''],
            ['.env', ''],
            ['.env.local', ''],
            ['.DS_Store', ''],
            ['package.json', ''],
            ['README.md', '']
        ];

        // Create directories
        dirsToCreate.forEach(dir => {
            fs.mkdirSync(path.join(testDir, dir), { recursive: true });
        });

        // Create files
        filesToCreate.forEach(([file, content]) => {
            fs.writeFileSync(path.join(testDir, file), content);
        });
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
        if (fs.existsSync(gitignorePath)) {
            fs.unlinkSync(gitignorePath);
        }
    });

    test('should exclude all default ignored patterns', () => {
        manager = new FolderStructureManager();
        manager.generateStructureText(testDir, outputFile);

        const output = fs.readFileSync(outputFile, 'utf8');

        // Check that ignored directories and files are not included
        expect(output).not.toContain('.git');
        expect(output).not.toContain('node_modules');
        expect(output).not.toContain('.vscode');
        expect(output).not.toContain('dist');
        expect(output).not.toContain('build');
        expect(output).not.toContain('coverage');
        expect(output).not.toContain('logs');
        expect(output).not.toContain('.DS_Store');
        expect(output).not.toContain('.env');

        // Check that regular project files are included
        expect(output).toContain('src/');
        expect(output).toContain('index.js');
        expect(output).toContain('Button.js');
        expect(output).toContain('package.json');
        expect(output).toContain('README.md');
    });

    test('should include all files when --include-hidden is used', () => {
        manager = new FolderStructureManager({ includeHidden: true });
        manager.generateStructureText(testDir, outputFile);

        const output = fs.readFileSync(outputFile, 'utf8');

        // Check that normally ignored files are now included
        expect(output).toContain('.git/');
        expect(output).toContain('node_modules/');
        expect(output).toContain('.vscode/');
        expect(output).toContain('dist/');
        expect(output).toContain('build/');
        expect(output).toContain('coverage/');
        expect(output).toContain('logs/');
        expect(output).toContain('.DS_Store');
        expect(output).toContain('.env');

        // Check that regular files are still there
        expect(output).toContain('src/');
        expect(output).toContain('package.json');
        expect(output).toContain('README.md');
    });

    test('should respect custom .gitignore patterns', () => {
        // Create test .gitignore with custom patterns
        const gitignoreContent = `
# Custom ignore patterns
*.test.js
temp/**
custom-dir/
src/secret.js
*.tmp
        `.trim();
        fs.writeFileSync(gitignorePath, gitignoreContent);

        // Create additional test files
        fs.mkdirSync(path.join(testDir, 'temp'));
        fs.mkdirSync(path.join(testDir, 'custom-dir'));
        fs.writeFileSync(path.join(testDir, 'src/component.test.js'), '');
        fs.writeFileSync(path.join(testDir, 'src/secret.js'), '');
        fs.writeFileSync(path.join(testDir, 'data.tmp'), '');

        manager = new FolderStructureManager();
        manager.loadIgnoreRules(gitignorePath);
        manager.generateStructureText(testDir, outputFile);

        const output = fs.readFileSync(outputFile, 'utf8');

        // Check that custom ignored patterns are respected
        expect(output).not.toContain('component.test.js');
        expect(output).not.toContain('temp');
        expect(output).not.toContain('custom-dir');
        expect(output).not.toContain('secret.js');
        expect(output).not.toContain('data.tmp');

        // Check that non-ignored files are still included
        expect(output).toContain('src/');
        expect(output).toContain('index.js');
        expect(output).toContain('Button.js');
    });

    test('should handle nested ignored patterns correctly', () => {
        // Create nested structure with ignored patterns
        const nestedDir = path.join(testDir, 'nested');
        fs.mkdirSync(nestedDir);
        fs.mkdirSync(path.join(nestedDir, '.git'));
        fs.mkdirSync(path.join(nestedDir, 'node_modules'));
        fs.writeFileSync(path.join(nestedDir, '.env'), '');
        fs.writeFileSync(path.join(nestedDir, 'package.json'), '');

        manager = new FolderStructureManager();
        manager.generateStructureText(testDir, outputFile);

        const output = fs.readFileSync(outputFile, 'utf8');

        // Check that nested ignored items are not included
        expect(output).toContain('nested/');
        expect(output).not.toContain('.git');
        expect(output).not.toContain('node_modules');
        expect(output).not.toContain('.env');
        expect(output).toContain('package.json');
    });

    test('should handle empty .gitignore file', () => {
        fs.writeFileSync(gitignorePath, '');

        manager = new FolderStructureManager();
        manager.loadIgnoreRules(gitignorePath);
        manager.generateStructureText(testDir, outputFile);

        // Should not throw error and should still apply default ignores
        const output = fs.readFileSync(outputFile, 'utf8');
        expect(output).not.toContain('.git');
        expect(output).toContain('src/');
    });

    test('should handle missing .gitignore file gracefully', () => {
        manager = new FolderStructureManager();

        // Should not throw error when loading non-existent .gitignore
        expect(() => {
            manager.loadIgnoreRules('non-existent-gitignore');
        }).not.toThrow();

        // Should still generate structure with default ignores
        manager.generateStructureText(testDir, outputFile);
        const output = fs.readFileSync(outputFile, 'utf8');
        expect(output).not.toContain('.git');
        expect(output).toContain('src/');
    });

    test('should combine default ignores with .gitignore patterns', () => {
        const gitignoreContent = `
# Custom patterns
*.test.js
custom-ignore/**
        `.trim();
        fs.writeFileSync(gitignorePath, gitignoreContent);

        // Create test files
        fs.mkdirSync(path.join(testDir, 'custom-ignore'));
        fs.writeFileSync(path.join(testDir, 'src/component.test.js'), '');

        manager = new FolderStructureManager();
        manager.loadIgnoreRules(gitignorePath);
        manager.generateStructureText(testDir, outputFile);

        const output = fs.readFileSync(outputFile, 'utf8');

        // Check both default and custom ignores
        expect(output).not.toContain('.git');
        expect(output).not.toContain('node_modules');
        expect(output).not.toContain('component.test.js');
        expect(output).not.toContain('custom-ignore');
        expect(output).toContain('src/');
        expect(output).toContain('index.js');
    });
});
