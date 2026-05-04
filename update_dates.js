const fs = require('fs');
const path = require('path');

const today = "2026-05-04";
const pattern = /lastUpdate="[^"]*"/g;

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const newContent = content.replace(pattern, `lastUpdate="${today}"`);
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

walk('app');
