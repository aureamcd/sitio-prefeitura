async function main() {
    try {
        const response = await fetch("https://transparencia.padremarcos.pi.gov.br/Transparencia/Default.aspx");
        const text = await response.text();
        console.log("Default.aspx HTML length:", text.length);
        
        // Procurar por IDs de comboboxes ou inputs na página Default.aspx
        const ids = text.match(/id="([^"]*?(?:exercicio|ano|empresa|cmb|combo|select|opt|btn|menu)[^"]*?)"/gi) || [];
        console.log("Matching IDs on Default.aspx:");
        console.log(Array.from(new Set(ids)).slice(0, 30));
        
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
main();
