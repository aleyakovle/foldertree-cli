const fs = require('fs');
const path = require('path');

function createTestDirectory(structure, baseDir) {
    Object.entries(structure).forEach(([name, content]) => {
        const fullPath = path.join(baseDir, name);
        if (content === null) {
            // It's a file
            fs.writeFileSync(fullPath, '');
        } else {
            // It's a directory
            fs.mkdirSync(fullPath, { recursive: true });
            createTestDirectory(content, fullPath);
        }
    });
}

module.exports = {
    createTestDirectory,
};
