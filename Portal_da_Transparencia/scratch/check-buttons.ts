import * as fs from "fs";

async function main() {
    try {
        const response = await fetch("https://transparencia.padremarcos.pi.gov.br/Transparencia/Servidores.ASPX");
        const text = await response.text();
        
        // Procurar por IDs contendo Exercicio, Ano, ou Empresa
        const matches = text.match(/id="([^"]*?(?:exercicio|ano|empresa)[^"]*?)"/gi) || [];
        console.log("Matching IDs found:");
        console.log(Array.from(new Set(matches)));
        
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
main();
