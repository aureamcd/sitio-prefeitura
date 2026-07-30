import pkg from 'pdf.js-extract';
console.log("Keys:", Object.keys(pkg));
const { PDFExtract } = pkg;
console.log("PDFExtract constructor:", typeof PDFExtract);
