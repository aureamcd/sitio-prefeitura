import * as xlsx from 'xlsx';

const filePath = 'C:\\Users\\Áurea Letícia\\Downloads\\listagem_obras (1).xlsx';
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

console.log("Headers:");
console.log(data[0]);
console.log("First row of data:");
console.log(data[1]);
