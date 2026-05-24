const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = path.join(__dirname, 'Cartilha-PNTP-2026.pdf');
const data = fs.readFileSync(pdfPath);
let text = data.toString('latin1');

// Extract text between parentheses in PDF streams (simple approach)
const matches = text.match(/\(([^)]*)\)/g) || [];
let extracted = matches.map(m => m.slice(1, -1)).join('\n');

fs.writeFileSync('/tmp/cartilha-pntp-2026.txt', extracted);
console.log('OK. Total chars:', extracted.length);
