/**
 * baixar-todas-folhas.ts
 *
 * Baixa TODAS as folhas mensais de janeiro/2023 até o mês atual.
 *
 * USO:
 *   npx tsx scripts/automatico/baixar-todas-folhas.ts
 *   npx tsx scripts/automatico/baixar-todas-folhas.ts --desde=2024
 *   npx tsx scripts/automatico/baixar-todas-folhas.ts --ate=2025-06
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
    let desdeAno = 2023;
    let desdeMes = 1;
    let ateAno: number | undefined;
    let ateMes: number | undefined;

    for (const arg of args) {
        const matchDesde = arg.match(/^--desde=(\d{4})(?:-(\d{1,2}))?$/);
        if (matchDesde) {
            desdeAno = Number(matchDesde[1]);
            desdeMes = matchDesde[2] ? Number(matchDesde[2]) : 1;
        }

        const matchAte = arg.match(/^--ate=(\d{4})(?:-(\d{1,2}))?$/);
        if (matchAte) {
            ateAno = Number(matchAte[1]);
            ateMes = matchAte[2] ? Number(matchAte[2]) : 12;
        }
    }

    return { desdeAno, desdeMes, ateAno, ateMes };
}

function gerarMesesDecrescente(
    desdeAno: number,
    desdeMes: number,
    ateAno: number,
    ateMes: number
): { ano: number; mes: number }[] {
    const meses: { ano: number; mes: number }[] = [];
    let ano = ateAno;
    let mes = ateMes;

    while (ano > desdeAno || (ano === desdeAno && mes >= desdeMes)) {
        meses.push({ ano, mes });
        mes--;
        if (mes < 1) {
            mes = 12;
            ano--;
        }
    }

    return meses;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Espera até que não haja mais requisições de rede por 500 ms */
async function waitForNetworkIdle(page: puppeteer.Page, timeout = 30_000) {
    try {
        await page.waitForNetworkIdle({ idleTime: 500, timeout });
    } catch {
        // Se der timeout na rede, continua mesmo assim
    }
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

    // Default to downloading from 2023.01 up to 2026.05 if not specified
    const anoAtual = cliArgs.ateAno ?? 2026;
    const mesAtual = cliArgs.ateMes ?? 5;
    const anoInicial = cliArgs.desdeAno ?? 2023;
    const mesInicial = cliArgs.desdeMes ?? 1;

    // Gerar lista de todos os meses em ordem decrescente
    const meses = gerarMesesDecrescente(anoInicial, mesInicial, anoAtual, mesAtual);

    // Criar diretório de saída
    fs.mkdirSync(DIR_DOWNLOAD, { recursive: true });

    console.log("🚀 INICIANDO DOWNLOAD DE TODAS AS FOLHAS DE PAGAMENTO");
    console.log(`📁 Diretório de saída: ${DIR_DOWNLOAD}`);
    console.log(
        `📅 Período (Decrescente): ${anoAtual}/${String(mesAtual).padStart(2, "0")} até ${anoInicial}/${String(mesInicial).padStart(2, "0")}`
    );
    console.log(`📊 Total de meses: ${meses.length}`);

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

    let totalSucesso = 0;
    let totalPulado = 0;
    let totalErro = 0;

    try {
        // ── Agrupar meses por ano ────────────────────────────────────────
        const mesesPorAno = new Map<number, number[]>();
        for (const m of meses) {
            if (!mesesPorAno.has(m.ano)) mesesPorAno.set(m.ano, []);
            mesesPorAno.get(m.ano)!.push(m.mes);
        }

        const anosDecrescente = Array.from(mesesPorAno.keys()).sort((a, b) => b - a);

        // ── Processar cada ano separadamente ─────────────────────────────
        for (const ano of anosDecrescente) {
            const listaMeses = mesesPorAno.get(ano)!;
            
            console.log(`\n========================================`);
            console.log(`📆 INICIANDO O ANO: ${ano}`);
            console.log(`========================================`);

            // 1. Navegar para a página inicial (Default.aspx) onde fica a caixa do ano
            console.log(`  🌐 Navegando para a página Principal para trocar o ano...`);
            await page.goto(URL_DEFAULT, {
                waitUntil: "networkidle2",
                timeout: 60_000,
            });
            await waitForNetworkIdle(page);

            // 2. Definir o exercício (ano) POR CLIQUE E DIGITAÇÃO (como um humano)
            console.log(`  📆 Selecionando o ano ${ano}...`);
            try {
                // Tenta interagir nativamente com DevExpress
                await page.evaluate((anoStr: string) => {
                    // @ts-ignore
                    if (typeof cmbExercicio !== "undefined") {
                        // @ts-ignore
                        cmbExercicio.SetValue(anoStr);
                        // @ts-ignore
                        if (cmbExercicio.SelectedIndexChanged) cmbExercicio.SelectedIndexChanged.FireEvent(cmbExercicio, {});
                    }
                }, String(ano));
                
                await new Promise((r) => setTimeout(r, 2000));
                
                // Clica 3 vezes para selecionar todo o texto que já está na caixa e digita
                await page.click('#cmbExercicio_I', { clickCount: 3 });
                await page.keyboard.type(String(ano));
                await page.keyboard.press('Enter');
            } catch (e) {
                console.log(`  ⚠️ Erro ao tentar digitar o ano...`);
            }
            
            // Aguarda um tempo maior pois a troca de ano sempre dispara um postback no DevExpress
            await new Promise((r) => setTimeout(r, 4000));
            await waitForNetworkIdle(page);

            // 3. Clica no card "Servidores" chamando a função nativa do site
            console.log(`  🖱️  Acessando Servidores...`);
            try {
                await page.evaluate(() => {
                    // @ts-ignore
                    if (typeof ProcessaDados === 'function') {
                        // @ts-ignore
                        ProcessaDados('LnkServidores');
                    } else {
                        // Fallback se a função não existir
                        document.getElementById('LnkServidores')?.click();
                    }
                });
            } catch (e) {
                console.log(`  ⚠️ Erro ao acessar Servidores via clique! Tentando ir pela URL...`);
                await page.goto(URL_SERVIDORES, { waitUntil: "networkidle2" });
            }
            await waitForNetworkIdle(page);
            await new Promise((r) => setTimeout(r, 4000)); // Espera a página de servidores carregar bem

            // 4. Pegar todos os meses desse ano
            for (let idx = 0; idx < listaMeses.length; idx++) {
                const mes = listaMeses[idx];
                const label = `${ano}/${String(mes).padStart(2, "0")}`;
                const progresso = `[Mês ${idx + 1}/${listaMeses.length}]`;

                // Se o arquivo já existe, pular
                const arquivoExistente = path.join(
                    DIR_DOWNLOAD,
                    nomeArquivo(ano, mes, TIPO_FOLHA)
                );
                if (fs.existsSync(arquivoExistente)) {
                    console.log(`\n⏭️  ${progresso} ${label} — já baixado, pulando.`);
                    totalPulado++;
                    continue;
                }

                try {
                    console.log(`\n────────────────────────────────────────`);
                    console.log(`${progresso} 📋 Processando: ${label}`);

                    // 4. Definir o mês via API do DevExpress com FireEvent ou Select Nativo
                    const mesStr = String(mes).padStart(2, "0");
                    console.log(`  📅 Definindo mês: ${mesStr}...`);
                    await page.evaluate((str: string, mesNum: number) => {
                        // Tentar DevExpress primeiro
                        // @ts-ignore
                        if (typeof cmbMes !== "undefined") {
                            // @ts-ignore
                            cmbMes.SetValue(str);
                            // @ts-ignore
                            if (cmbMes.SelectedIndexChanged) cmbMes.SelectedIndexChanged.FireEvent(cmbMes, {});
                        } else {
                            // Tentar encontrar um select nativo
                            const selects = document.querySelectorAll('select');
                            const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                            const nomeMes = mesesNomes[mesNum - 1];
                            
                            for (let i = 0; i < selects.length; i++) {
                                const select = selects[i];
                                if (select.options.length >= 12) {
                                    for (let j = 0; j < select.options.length; j++) {
                                        const opt = select.options[j];
                                        if (opt.text.trim().toLowerCase() === nomeMes.toLowerCase() || opt.value === str || opt.value === String(mesNum)) {
                                            select.selectedIndex = j;
                                            select.dispatchEvent(new Event('change', { bubbles: true }));
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }, mesStr, mes);
                    
                    // O DevExpress costuma fazer uma chamada AJAX rápida (Callback) ao mudar de mês
                    await new Promise((r) => setTimeout(r, 2000));
                    await waitForNetworkIdle(page);

                    // 5. Clicar em Pesquisar
                    console.log(`  🔍 Clicando em Pesquisar...`);
                    const btnPesquisar = await page.$("#btnPesquisar");
                    if (!btnPesquisar) {
                        console.log(`  ⚠️ Botão Pesquisar não encontrado, pulando.`);
                        totalPulado++;
                        continue;
                    }
                    await btnPesquisar.click();

                    // Aguardar o grid carregar (AJAX callback do DevExpress)
                    try {
                        await page.waitForSelector("#gridPessoal", {
                            timeout: 15_000,
                        });
                        // Dá mais 2 segundinhos pro grid estabilizar
                        await new Promise((r) => setTimeout(r, 2000));
                    } catch {
                        console.log(`  ⚠️ Grid não carregou (pode ser mês sem dados).`);
                    }
                    await waitForNetworkIdle(page);

                    // 6. Verificar se o botão Exportar CSV está visível
                    const btnExportar = await page.$("#btnExportarCSV");
                    if (!btnExportar) {
                        console.log(`  ⚠️ Botão Exportar CSV não encontrado, pulando.`);
                        totalPulado++;
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
                        totalPulado++;
                        continue;
                    }

                    // 7. Registrar arquivos antes do download
                    const filesBefore = fs.readdirSync(DIR_DOWNLOAD);

                    // 8. Clicar em Exportar CSV
                    console.log(`  💾 Exportando CSV...`);
                    await btnExportar.click();

                    // 9. Aguardar download
                    console.log(`  ⏳ Aguardando download...`);
                    const downloadedFile = await waitForDownload(
                        DIR_DOWNLOAD,
                        filesBefore,
                        30_000
                    );

                    if (!downloadedFile) {
                        console.log(`  ⚠️ Download não detectado, pulando.`);
                        totalPulado++;
                        continue;
                    }

                    // 10. Renomear arquivo
                    const finalPath = path.join(
                        DIR_DOWNLOAD,
                        nomeArquivo(ano, mes, TIPO_FOLHA)
                    );

                    if (fs.existsSync(finalPath)) {
                        fs.unlinkSync(finalPath);
                    }

                    fs.renameSync(downloadedFile, finalPath);
                    console.log(`  ✅ Salvo: ${path.basename(finalPath)}`);
                    totalSucesso++;
                } catch (error) {
                    console.error(`  ❌ Erro ao processar ${label}:`, error);
                    totalErro++;
                }
            }
        }
    } catch (error) {
        console.error("❌ Erro fatal:", error);
    } finally {
        console.log("\n🔒 Fechando navegador...");
        await browser.close();
    }

    // ── Resumo final ──────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("🎉 DOWNLOAD DE FOLHAS FINALIZADO");
    console.log(`✅ Sucesso: ${totalSucesso}`);
    console.log(`⏭️  Pulados: ${totalPulado}`);
    console.log(`❌ Erros:   ${totalErro}`);
    console.log(`📊 Total:   ${meses.length} meses`);
    console.log("════════════════════════════════════════");
}

// Executar
main().catch((err) => {
    console.error("❌ Erro inesperado:", err);
    process.exit(1);
});
