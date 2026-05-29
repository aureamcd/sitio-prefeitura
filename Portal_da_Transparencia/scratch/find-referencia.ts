async function main() {
    try {
        const response = await fetch("https://transparencia.padremarcos.pi.gov.br/Transparencia/Servidores.ASPX");
        const text = await response.text();
        
        // Procurar por todos os inputs do tipo radio
        const regex = /<input[^>]*type="radio"[^>]*>/gi;
        const matches = text.match(regex) || [];
        console.log("All radio buttons found in Servidores.aspx:");
        for (const match of matches) {
            console.log(match);
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
main();
