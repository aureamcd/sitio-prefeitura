async function main() {
    try {
        const response = await fetch("https://transparencia.padremarcos.pi.gov.br/Transparencia/Servidores.ASPX");
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("HTML length:", text.length);
        
        // Procurar por inputs, selects ou DevExpress
        const selectRegex = /<select[^>]*>([\s\S]*?)<\/select>/gi;
        const selects = text.match(selectRegex) || [];
        console.log("Found", selects.length, "select tags.");
        for (let i = 0; i < Math.min(selects.length, 5); i++) {
            console.log(`Select ${i + 1} tag:`, selects[i].substring(0, 300));
        }

        // Buscar referências a dx ou devExpress no HTML
        const dxMatches = text.match(/dx[a-zA-Z]+/g) || [];
        console.log("DevExpress references count:", dxMatches.length);
        
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
main();
