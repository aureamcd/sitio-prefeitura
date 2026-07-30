const xlsx = require('xlsx');

function check(file) {
    console.log("Reading", file);
    try {
        const wb = xlsx.readFile(file);
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(ws);
        console.log("Total rows:", data.length);
        if (data.length > 0) {
            console.log("First row keys:", Object.keys(data[0]));
            console.log("First row:", data[0]);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

check('C:\\Users\\Áurea Letícia\\Downloads\\contratos.xlsx');
check('C:\\Users\\Áurea Letícia\\Downloads\\contratos (1).xlsx');
