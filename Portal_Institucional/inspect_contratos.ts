import * as XLSX from 'xlsx';

const workbook = XLSX.readFile('C:/Users/Áurea Letícia/Downloads/contratos.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

if (data.length > 0) {
  console.log("Colunas encontradas:");
  console.log(data[0]);
  
  if (data.length > 1) {
    console.log("\nExemplo da primeira linha de dados:");
    console.log(data[1]);
  }
} else {
  console.log("Planilha vazia.");
}
