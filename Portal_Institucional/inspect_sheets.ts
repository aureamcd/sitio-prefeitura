import * as xlsx from "xlsx";
import fs from "fs";

function inspect(file: string) {
  try {
    const wb = xlsx.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(ws);
    console.log(`\n=== ${file} ===`);
    console.log("Total rows:", rows.length);
    if (rows.length > 0) {
      console.log("Headers:", Object.keys(rows[0]));
      console.log("Row 1 sample:");
      console.log(rows[0]);
    }
  } catch (e: any) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

inspect("C:/Users/Áurea Letícia/Downloads/licitações.xlsx");
inspect("C:/Users/Áurea Letícia/Downloads/licitações (1).xlsx");
inspect("C:/Users/Áurea Letícia/Downloads/licitações (2).xlsx");
