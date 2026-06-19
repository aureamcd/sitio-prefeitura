import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as xlsx from "xlsx";
import { normalizarModalidade, normalizarSituacao } from "@/lib/admin/normalizar";

function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr || dateStr.toString().trim() === "") return null;
  const s = dateStr.toString().trim().split(" ")[0];
  const parts = s.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

function parseCurrency(valStr: string | number | undefined | null): number {
  if (valStr === undefined || valStr === null) return 0;
  if (typeof valStr === "number") return valStr;
  let s = valStr.toString().trim();
  s = s.replace(/[^\d,\\.-]/g, "");
  s = s.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

function getEmpresaCode(orgao: string): string | null {
  const upper = orgao.toUpperCase();
  if (upper.includes("SAÚDE") || upper.includes("SAUDE") || upper.includes("F. M. S.")) return "3";
  if (upper.includes("FUNDEB") || upper.includes("EDUCAÇÃO") || upper.includes("EDUCACAO")) return "4";
  if (upper.includes("ASSISTÊNCIA") || upper.includes("ASSISTENCIA") || upper.includes("F. M. A. S.")) return "5";
  if (upper.includes("HOSPITAL") || upper.includes("UNIDADE MISTA")) return "6";
  if (upper.includes("PREVIDÊNCIA") || upper.includes("PREVIDENCIA") || upper.includes("RPPS")) return "7";
  if (upper.includes("DIREITOS DA CRIANÇA")) return "8";
  if (upper.includes("MEIO AMBIENTE")) return "9";
  if (upper.includes("CULTURA")) return "10";
  if (upper.includes("P. M.") || upper.includes("PREFEITURA") || upper.includes("FPM")) return "1";
  return null;
}

function identifyColumns(columns: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const col of columns) {
    const c = col.toLowerCase().trim();
    if (c.includes("órgão") || c.includes("orgao") || c === "órgão" || c === "orgao") map["orgao"] = col;
    else if (c.includes("esfera")) map["esfera"] = col;
    else if (c.includes("proc. tce") || c.includes("processo tce")) map["proclic"] = col;
    else if ((c.includes("procedimento") || c.includes("nº procedimento") || c.includes("n procedimento")) && (c.includes("nº") || c.includes("n°") || c.includes("n "))) map["procedimento"] = col;
    else if (c.includes("modalidade")) map["modalidade"] = col;
    else if (c.includes("lei") || c.includes("legislação") || c.includes("legislacao")) map["lei"] = col;
    else if (c.includes("forma realização") || c.includes("forma realizacao")) map["forma_realizacao"] = col;
    else if (c.includes("critério") || c.includes("criterio") || c.includes("julg")) map["criterio_julg"] = col;
    else if (c.includes("tipo objeto")) map["tipo_objeto"] = col;
    else if (c.includes("objeto")) map["objeto"] = col;
    else if (c.includes("abert") || c.includes("abert/julg") || c.includes("data abert")) map["data_abertura"] = col;
    else if (c.includes("homologad") && c.includes("valor")) map["valor_homologado"] = col;
    else if ((c.includes("estimado") || c.includes("valor")) && !c.includes("homologad") && !c.includes("atualizado") && !c.includes("empenh") && !c.includes("pago") && !c.includes("executado")) map["valor"] = col;
    else if (c.includes("status") || c.includes("situação") || c.includes("situacao")) map["status"] = col;
    else if (c.includes("últ. public") || c.includes("ult. public") || c.includes("ultima public") || c.includes("última public")) map["dt_ult_public"] = col;
    else if (c.includes("adjudicação") || c.includes("adjudicacao") || c.includes("adjudica")) map["dt_adjudicacao"] = col;
    else if (c.includes("homologação") || c.includes("homologacao") || c.includes("homologa")) map["dt_homologacao"] = col;
    else if (c.includes("finalização") || c.includes("finalizacao") || c.includes("finaliza")) map["dt_finalizacao"] = col;
    else if (c.includes("cadastro") || c.includes("dt cadastro")) map["dt_cadastro"] = col;
    else if (c.includes("atualização") || c.includes("atualizacao") || c.includes("atualiza")) map["dt_atualizacao"] = col;
    else if (c.includes("caminho") || c.includes("detalhamento") || c.includes("link")) map["link_tce"] = col;
    else if (c.includes("n° proc") || c.includes("n proc") || c.includes("processo")) {
      if (!map["procedimento"]) map["procedimento"] = col;
    }
  }
  return map;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      return NextResponse.json({ error: "Formato inválido. Aceitamos apenas .xlsx, .xls ou .csv" }, { status: 400 });
    }

    // Read file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const wb = xlsx.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(ws);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Planilha vazia" }, { status: 400 });
    }

    // Identify columns from first row keys
    const columns = Object.keys(rows[0]);
    const colMap = identifyColumns(columns);

    const supabase = createServerClient();

    // Buscar existentes para evitar duplicatas
    const { data: existentes } = await supabase
      .schema("transparencia")
      .from("licitacoes_v2")
      .select("id, proclic, numero, processo");

    const procTceMap = new Map<string, string>();
    const numMap = new Map<string, string>();
    for (const row of existentes || []) {
      if (row.proclic) procTceMap.set(row.proclic, row.id);
      if (row.numero) {
        const match = row.numero.match(/(\d+)[/-](\d{4})/);
        if (match) numMap.set(`${parseInt(match[1], 10)}/${match[2]}`, row.id);
      }
    }

    let inseridas = 0;
    let atualizadas = 0;
    let comErros = 0;
    const erros: string[] = [];

    for (const row of rows) {
      try {
        const proclic = colMap["proclic"] ? String(row[colMap["proclic"]] || "").trim() : "";
        const numero = colMap["procedimento"] ? String(row[colMap["procedimento"]] || "").trim() : "";
        const modalidade = colMap["modalidade"] ? String(row[colMap["modalidade"]] || "").trim() : "";
        const tipoObjeto = colMap["tipo_objeto"] ? String(row[colMap["tipo_objeto"]] || "").trim() : "";
        const dataAberturaRaw = colMap["data_abertura"] ? String(row[colMap["data_abertura"]] || "") : "";
        const valor = parseCurrency(colMap["valor"] ? row[colMap["valor"]] : null);
        const valorHomologado = parseCurrency(colMap["valor_homologado"] ? row[colMap["valor_homologado"]] : null);
        const situacao = colMap["status"] ? String(row[colMap["status"]] || "").trim() : "INDEFINIDA";
        const objeto = colMap["objeto"] ? String(row[colMap["objeto"]] || "").trim() : "";
        const orgao = colMap["orgao"] ? String(row[colMap["orgao"]] || "").trim() : "";
        const linkTce = colMap["link_tce"] ? String(row[colMap["link_tce"]] || "").trim() : "";

        // Limpar o número para salvar apenas ex: "002/2026" em vez de "Pregão nº 002/2026"
        let numeroLimpo = numero;
        const matchNum = numero.match(/(\d+)[/-](\d{4})/);
        if (matchNum) {
          numeroLimpo = `${matchNum[1].padStart(3, '0')}/${matchNum[2]}`;
        }

        if (!numeroLimpo && !objeto) continue; // skip empty rows

        const anoStr = parseDate(dataAberturaRaw)?.split("-")[0] || (matchNum ? matchNum[2] : new Date().getFullYear().toString());
        const ano = parseInt(anoStr, 10);

        const dataAbertura = parseDate(dataAberturaRaw);
        const dataFinalizacao = parseDate(colMap["dt_finalizacao"] ? String(row[colMap["dt_finalizacao"]] || "") : "");
        const dataHomologacao = parseDate(colMap["dt_homologacao"] ? String(row[colMap["dt_homologacao"]] || "") : "");
        const dataAdjudicacao = parseDate(colMap["dt_adjudicacao"] ? String(row[colMap["dt_adjudicacao"]] || "") : "");
        const dataEncerramento = dataFinalizacao || dataHomologacao || dataAdjudicacao;
        const empresaCode = getEmpresaCode(orgao);

        const record = {
          ano: isNaN(ano) ? new Date().getFullYear() : ano,
          proclic: proclic || null,
          numero: numeroLimpo || null,
          processo: numeroLimpo || null,
          modalidade: normalizarModalidade(modalidade) || null,
          tipo_licitacao: tipoObjeto || null,
          data_abertura: dataAbertura,
          data_encerramento: dataEncerramento,
          objeto: objeto || null,
          situacao: normalizarSituacao(situacao) || null,
          valor_estimado: valor,
          valor_homologado: valorHomologado,
          empresa: empresaCode,
          empresa_nome: orgao || null,
          origem: "IMPORTACAO_XLSX",
          link_tce: linkTce || null,
        };

        // Check if exists
        let existingId: string | null = null;
        if (proclic && procTceMap.has(proclic)) {
          existingId = procTceMap.get(proclic)!;
        }
        if (!existingId && numero) {
          const matchNum = numero.match(/(\d+)[/-](\d{4})/);
          if (matchNum) {
            const key = `${parseInt(matchNum[1], 10)}/${matchNum[2]}`;
            if (numMap.has(key)) existingId = numMap.get(key)!;
          }
        }

        if (existingId) {
          // O usuário pediu para não atualizar registros existentes, apenas pular
          atualizadas++; // Podemos usar 'atualizadas' para significar 'ignoradas/já existentes' ou criar uma nova variável. Vamos manter atualizadas para reaproveitar a UI, mas ela significa ignoradas agora.
        } else {
          const { error } = await supabase
            .schema("transparencia")
            .from("licitacoes_v2")
            .insert([record]);

          if (error) throw new Error(`Insert ${numero}: ${error.message}`);
          inseridas++;
        }
      } catch (err: any) {
        comErros++;
        erros.push(err.message);
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      inseridas,
      atualizadas,
      comErros,
      erros: erros.slice(0, 10), // limit error details
    });
  } catch (error: any) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
