const { StructureValidator } = require('../index');
const fs = require('fs');
const path = require('path');

describe('StructureValidator', () => {
    let validator;
    let testFile;

    beforeEach(() => {
        validator = new StructureValidator();
        testFile = path.join(__dirname, 'test-structure.txt');
    });

    afterEach(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    test('should validate correct structure', () => {
        const validStructure =
`├── folder1/
│   ├── file1.txt
│   └── file2.txt
└── folder2/
    └── subfolder/
        └── file3.txt`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject invalid characters between separator and tree symbol', () => {
        const invalidStructure =
`├── folder1/
│   invalid├── file1.txt
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid characters/);
    });

    test('should reject inconsistent indentation', () => {
        const invalidStructure =
`├── folder1/
│       ├── file1.txt
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Inconsistent indentation/);
    });

    test('should reject invalid tree characters', () => {
        const invalidStructure =
`├── folder1/
│   --- file1.txt
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid characters/);
    });

    test('should allow valid special characters in names', () => {
        const validStructure =
`├── .env.example
├── .gitignore
├── docker-compose.yml
└── folder.with.dots/
    └── file-with-hyphen.txt`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should validate empty lines and separators', () => {
        const validStructure =
`├── folder1/
│
│   ├── file1.txt
│
└── folder2/`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject completely empty file', () => {
        fs.writeFileSync(testFile, '');
        expect(() => validator.validateFile(testFile)).toThrow(/Input file is empty/);
    });

    test('should validate complex nested structure', () => {
        const validStructure =
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
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject invalid file names', () => {
        const invalidStructure =
`├── folder1/
│   ├── file1*.txt
│   └── file2?.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid line format/);
    });

    test('should reject missing tree characters', () => {
        const invalidStructure =
`├── folder1/
    file1.txt
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid characters/);
    });

    test('should validate structure with only root files', () => {
        const validStructure =
`├── file1.txt
├── file2.txt
└── file3.txt`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject invalid indentation steps', () => {
        const invalidStructure =
`├── folder1/
│       ├── file1.txt
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Inconsistent indentation/);
    });

    test('should validate structure with multiple empty lines', () => {
        const validStructure =
`├── folder1/


│   ├── file1.txt

│   └── file2.txt

└── folder2/`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject structure with invalid separator characters', () => {
        const invalidStructure =
`├── folder1/
|   ├── file1.txt
│   └── file2.txt`;  // Note the different separator character
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid characters/);
    });

    test('should validate structure with maximum allowed depth', () => {
        const validStructure =
`├── level1/
│   ├── level2/
│   │   ├── level3/
│   │   │   ├── level4/
│   │   │   │   └── file.txt
│   │   │   └── file.txt
│   │   └── file.txt
│   └── file.txt
└── file.txt`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject structure with invalid line endings', () => {
        const invalidStructure =
`├── folder1/ \\
│   ├── file1.txt  \\
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid line format/);
    });

    test('should validate structure with underscore in names', () => {
        const validStructure =
`├── my_folder/
│   ├── my_file.txt
│   └── another_file.txt`;
        fs.writeFileSync(testFile, validStructure);
        expect(() => validator.validateFile(testFile)).not.toThrow();
    });

    test('should reject structure with spaces in names', () => {
        const invalidStructure =
`├── my folder/
│   ├── my file.txt
│   └── file2.txt`;
        fs.writeFileSync(testFile, invalidStructure);
        expect(() => validator.validateFile(testFile)).toThrow(/Invalid line format/);
    });
});
