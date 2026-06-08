import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "https://contreina.padremarcos.pi.gov.br/Transparencia/VersaoJson/Pessoal/";

function limparTexto(valor: any): string | null {
    if (valor === undefined || valor === null || valor === "") return null;
    return String(valor).normalize("NFC").replace(/\s+/g, " ").trim();
}

function converterData(valor: any): string | null {
    if (!valor) return null;
    try {
        const texto = String(valor).trim();
        if (texto.includes("/")) {
            const apenasData = texto.split(" ")[0];
            const [dia, mes, ano] = apenasData.split("/");
            return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }
        return null;
    } catch {
        return null;
    }
}

async function executar() {
    console.log("🚀 PATCH: ATUALIZANDO DATAS DE ADMISSÃO E DESLIGAMENTO DOS SERVIDORES");

    // 1. Buscar todas as entidades
    const { data: entidades, error: errEnt } = await supabase
        .schema("transparencia")
        .from("empresas")
        .select("*");
        
    if (errEnt || !entidades) {
        console.error("Erro ao buscar entidades:", errEnt);
        return;
    }

    // 2. Buscar servidores existentes para saber o ID
    console.log("📦 Buscando servidores existentes no banco...");
    const { data: servidoresExistentes, error: errServ } = await supabase
        .schema("transparencia")
        .from("servidores")
        .select("id, matricula, nome");
        
    if (errServ || !servidoresExistentes) {
        console.error("Erro ao buscar servidores:", errServ);
        return;
    }
    
    // Mapear por matricula e nome
    const byMatricula = new Map();
    const byNome = new Map();
    for (const s of servidoresExistentes) {
        if (s.matricula) byMatricula.set(s.matricula, s.id);
        if (s.nome) byNome.set(s.nome, s.id);
    }
    
    console.log(`✅ ${servidoresExistentes.length} servidores em cache para atualização.`);

    // Map para armazenar as datas que encontraremos
    const updatesMap = new Map();

    const ANOS = [2026, 2025, 2024, 2023]; // Busca do mais recente para o mais antigo

    for (const entidade of entidades) {
        console.log(`\n🏢 Empresa: ${entidade.codigo} - ${entidade.nome}`);
        for (const ano of ANOS) {
            console.log(`📅 Buscando dados de ${ano}...`);
            // Busca apenas o último mês possível para ser mais rápido (ou mês 12)
            // A API de pessoal traz listagem. Vamos usar mês 12 ou o atual
            let mesBusca = ano === new Date().getFullYear() ? String(new Date().getMonth() + 1).padStart(2, "0") : "12";
            
            const params = new URLSearchParams({
                ConectarExercicio: String(ano),
                Listagem: "Servidores",
                Empresa: String(entidade.codigo),
                Ano: String(ano),
                DiaInicioPeriodo: "01",
                MesInicialPeriodo: mesBusca,
                DiaFinalPeriodo: "31",
                MesFinalPeriodo: mesBusca,
                MostraDadosConsolidado: "False",
            });

            const url = `${BASE}?${params}`;
            
            try {
                const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
                if (!response.ok) {
                    console.log(`⚠️ HTTP ${response.status}`);
                    continue;
                }
                
                const registros = await response.json();
                if (!Array.isArray(registros)) continue;
                
                let found = 0;
                for (const item of registros) {
                    const matricula = limparTexto(item.REGISTRO);
                    const nome = limparTexto(item.NOME);
                    const data_admissao = converterData(item.DATAADMISSAO);
                    const data_desligamento = converterData(item.DATADESLIGAMENTO);
                    
                    if (!data_admissao && !data_desligamento) continue;
                    
                    // Identificar o ID do servidor
                    let id = matricula ? byMatricula.get(matricula) : null;
                    if (!id && nome) id = byNome.get(nome);
                    
                    if (id && !updatesMap.has(id)) {
                        updatesMap.set(id, {
                            id,
                            data_admissao: data_admissao || null,
                            data_desligamento: data_desligamento || null
                        });
                        found++;
                    }
                }
                console.log(`✅ Encontradas datas para ${found} servidores na folha de ${mesBusca}/${ano}.`);
            } catch (error) {
                console.error(`❌ Erro em ${ano}:`, error);
            }
        }
    }

    const updates = Array.from(updatesMap.values());
    console.log(`\n💾 Iniciando atualização de ${updates.length} servidores no banco...`);
    
    if (updates.length > 0) {
        let ok = 0;
        for (const update of updates) {
            const { error } = await supabase
                .schema("transparencia")
                .from("servidores")
                .update({ 
                    data_admissao: update.data_admissao, 
                    data_desligamento: update.data_desligamento 
                })
                .eq("id", update.id);

            if (error) {
                console.error(`❌ Erro ao atualizar ID ${update.id}:`, error.message);
            } else {
                ok++;
                process.stdout.write(`\r✅ Progresso: ${ok}/${updates.length}`);
            }
        }
        console.log(`\n🎉 Atualização concluída! ${ok} registros atualizados.`);
    } else {
        console.log("Nenhuma data nova para atualizar.");
    }
}

executar();
