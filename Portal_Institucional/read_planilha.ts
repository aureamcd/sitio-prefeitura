import * as xlsx from "xlsx";
import * as fs from "fs";

const filePath = "c:/Users/Áurea Letícia/Downloads/licitações (2).xlsx";
const buffer = fs.readFileSync(filePath);
const wb = xlsx.read(buffer, { type: "buffer" });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws).slice(0, 5);
console.log(rows);
