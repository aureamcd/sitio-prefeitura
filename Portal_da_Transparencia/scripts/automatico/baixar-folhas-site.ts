/**
 * baixar-folhas-site.ts
 *
 * Automatiza o download de CSVs de folha de pagamento do portal
 * Fiorilli de transparência (Padre Marcos - PI).
 *
 * Fluxo: navega para Servidores.aspx, define ano e mês (deixa em "Todos"),
 * clica em Pesquisar, depois Exportar CSV.
 *
 * USO:
 *   npx tsx scripts/automatico/baixar-folhas-site.ts
 *   npx tsx scripts/automatico/baixar-folhas-site.ts --ano=2025 --mes=5
 */

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

// ─── Configurações ───────────────────────────────────────────────────────────

const URL_BASE =
    "https://transparencia.padremarcos.pi.gov.br/Transparencia";
const URL_DEFAULT = `${URL_BASE}/Default.aspx`;
const URL_SERVIDORES = `${URL_BASE}/Servidores.aspx`;

const DIR_DOWNLOAD = path.resolve(
    "c:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\Portal_da_Transparencia\\csv\\folhas"
);

const TIPO_FOLHA = "folha-mensal";

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);
    let ano: number | undefined;
    let mes: number | undefined;

    for (const arg of args) {
        const matchAno = arg.match(/^--ano=(\d{4})$/);
        if (matchAno) ano = Number(matchAno[1]);

        const matchMes = arg.match(/^--mes=(\d{1,2})$/);
        if (matchMes) mes = Number(matchMes[1]);
    }

    return { ano, mes };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Espera até que não haja mais requisições de rede por 500 ms */
async function waitForNetworkIdle(page: puppeteer.Page, timeout = 30_000) {
    await page.waitForNetworkIdle({ idleTime: 500, timeout });
}

/**
 * Espera até que um novo arquivo apareça no diretório de download.
 */
async function waitForDownload(
    dir: string,
    beforeFiles: string[],
    timeoutMs = 30_000
): Promise<string | null> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        const currentFiles = fs.readdirSync(dir);
        const newFiles = currentFiles.filter(
            (f) =>
                !beforeFiles.includes(f) &&
                !f.endsWith(".crdownload") &&
                !f.endsWith(".tmp")
        );

        if (newFiles.length > 0) {
            return path.join(dir, newFiles[0]);
        }

        await new Promise((r) => setTimeout(r, 500));
    }

    return null;
}

/** Gera o nome final do arquivo CSV */
function nomeArquivo(ano: number, mes: number, tipo: string): string {
    return `${ano}_${String(mes).padStart(2, "0")}_${tipo}.csv`;
}

// ─── Script principal ────────────────────────────────────────────────────────

async function main() {
    const cliArgs = parseArgs();

    const agora = new Date();
    const anoAtual = cliArgs.ano ?? agora.getFullYear();

    // Meses a processar
    let meses: { ano: number; mes: number }[] = [];

    if (cliArgs.mes !== undefined) {
        meses = [{ ano: anoAtual, mes: cliArgs.mes }];
    } else {
        // Padrão: mês corrente + mês anterior
        const mesAtual = agora.getMonth() + 1;
        let mesAnterior = mesAtual - 1;
        let anoAnterior = anoAtual;
        if (mesAnterior === 0) {
            mesAnterior = 12;
            anoAnterior = anoAtual - 1;
        }

        meses = [
            { ano: anoAnterior, mes: mesAnterior },
            { ano: anoAtual, mes: mesAtual },
        ];
    }

    // Criar diretório de saída
    fs.mkdirSync(DIR_DOWNLOAD, { recursive: true });

    console.log("🚀 INICIANDO DOWNLOAD DE FOLHAS DE PAGAMENTO");
    console.log(`📁 Diretório de saída: ${DIR_DOWNLOAD}`);
    console.log(
        `📅 Períodos: ${meses
            .map((p) => `${p.ano}/${String(p.mes).padStart(2, "0")}`)
            .join(", ")}`
    );

    // Abrir navegador
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 900 },
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Configurar diretório de download via CDP
    const cdpSession = await page.createCDPSession();
    await cdpSession.send("Browser.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: DIR_DOWNLOAD,
    });

    try {
        // ── Navegar para Default.aspx e setar o exercício ──────────────
        console.log("\n🌐 Abrindo portal de transparência...");
        await page.goto(URL_DEFAULT, {
            waitUntil: "networkidle2",
            timeout: 60_000,
        });
        await waitForNetworkIdle(page);

        console.log(`📆 Definindo exercício para ${anoAtual}...`);
        await page.evaluate((ano: number) => {
            // @ts-ignore – DevExpress client-side API
            if (typeof cmbExercicio !== "undefined") {
                // @ts-ignore
                cmbExercicio.SetValue(String(ano));
            }
        }, anoAtual);
        await waitForNetworkIdle(page);

        // ── Processar cada mês ───────────────────────────────────────────
        for (const { ano, mes } of meses) {
            const label = `${ano}/${String(mes).padStart(2, "0")}`;

            try {
                console.log(`\n────────────────────────────────────────`);
                console.log(`📋 Processando: ${label}`);

                // 1. Navegar para Servidores.aspx
                console.log(`  🌐 Navegando para Servidores.aspx...`);
                await page.goto(URL_SERVIDORES, {
                    waitUntil: "networkidle2",
                    timeout: 60_000,
                });
                await waitForNetworkIdle(page);

                // 2. Definir o exercício (ano)
                console.log(`  📆 Definindo exercício ${ano}...`);
                await page.evaluate((ano: number) => {
                    // @ts-ignore
                    if (typeof cmbExercicio !== "undefined") {
                        // @ts-ignore
                        cmbExercicio.SetValue(String(ano));
                    }
                }, ano);
                await waitForNetworkIdle(page);

                // 3. Definir o mês (deixa o tipo em "Todos")
                const mesStr = String(mes).padStart(2, "0");
                console.log(`  📅 Definindo mês: ${mes}...`);
                await page.evaluate((str: string) => {
                    // @ts-ignore – DevExpress client-side API
                    if (typeof cmbMes !== "undefined") {
                        // @ts-ignore
                        cmbMes.SetValue(str);
                    }
                }, mesStr);
                await waitForNetworkIdle(page);

                // 4. Clicar em Pesquisar
                console.log(`  🔍 Clicando em Pesquisar...`);
                const btnPesquisar = await page.$("#btnPesquisar");
                if (!btnPesquisar) {
                    console.log(`  ⚠️ Botão Pesquisar não encontrado, pulando.`);
                    continue;
                }
                await btnPesquisar.click();

                // Aguardar o grid carregar
                try {
                    await page.waitForSelector("#gridPessoal", {
                        timeout: 30_000,
                    });
                } catch {
                    // Grid pode não aparecer se não houver dados
                }
                await waitForNetworkIdle(page);

                // 5. Verificar se o botão Exportar CSV está visível
                const btnExportar = await page.$("#btnExportarCSV");
                if (!btnExportar) {
                    console.log(`  ⚠️ Botão Exportar CSV não encontrado, pulando.`);
                    continue;
                }

                const isVisible = await page.evaluate(
                    (el: Element) => {
                        const style = window.getComputedStyle(el);
                        return (
                            style.display !== "none" &&
                            style.visibility !== "hidden" &&
                            style.opacity !== "0"
                        );
                    },
                    btnExportar
                );

                if (!isVisible) {
                    console.log(`  ⚠️ Botão Exportar CSV não visível, pulando.`);
                    continue;
                }

                // 6. Registrar arquivos antes do download
                const filesBefore = fs.readdirSync(DIR_DOWNLOAD);

                // 7. Clicar em Exportar CSV
                console.log(`  💾 Exportando CSV...`);
                await btnExportar.click();

                // 8. Aguardar download
                console.log(`  ⏳ Aguardando download...`);
                const downloadedFile = await waitForDownload(
                    DIR_DOWNLOAD,
                    filesBefore,
                    30_000
                );

                if (!downloadedFile) {
                    console.log(`  ⚠️ Download não detectado, pulando.`);
                    continue;
                }

                // 9. Renomear arquivo
                const finalName = nomeArquivo(ano, mes, TIPO_FOLHA);
                const finalPath = path.join(DIR_DOWNLOAD, finalName);

                if (fs.existsSync(finalPath)) {
                    fs.unlinkSync(finalPath);
                }

                fs.renameSync(downloadedFile, finalPath);
                console.log(`  ✅ Salvo: ${finalName}`);
            } catch (error) {
                console.error(`  ❌ Erro ao processar ${label}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Erro fatal:", error);
    } finally {
        console.log("\n🔒 Fechando navegador...");
        await browser.close();
    }

    console.log("\n🎉 DOWNLOAD DE FOLHAS FINALIZADO");
}

// Executar
main().catch((err) => {
    console.error("❌ Erro inesperado:", err);
    process.exit(1);
});
