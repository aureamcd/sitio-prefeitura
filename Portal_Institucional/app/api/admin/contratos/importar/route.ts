import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { normalizarModalidade, normalizarSituacao } from "@/lib/admin/normalizar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  if (!isNaN(Number(str)) && str.length < 6) {
    const d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }

  const parts = str.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const partsDash = str.split("-");
  if (partsDash.length === 3) {
    if (partsDash[0].length === 4) return str;
    const [day, month, year] = partsDash;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function parseCurrency(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const s = String(val)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rawData.length < 2) {
      return NextResponse.json({ error: "Planilha vazia ou formato inválido" }, { status: 400 });
    }

    // Header está na linha 1 (índice 1) pq a linha 0 é "Resultados"
    const headerRow = (rawData[1] as string[]).map((c) => (c ? String(c).trim().toLowerCase() : ""));
    const rows = rawData.slice(2) as any[][];

    const colMap: Record<string, number> = {};
    headerRow.forEach((col, idx) => {
      if (col === "instrumento") colMap["numero"] = idx;
      else if (col === "proc. tce") colMap["processo"] = idx;
      else if (col === "contratado") colMap["contratado"] = idx;
      else if (col === "objeto") colMap["objeto"] = idx;
      else if (col === "valor") colMap["valor"] = idx;
      else if (col === "status") colMap["status"] = idx;
      else if (col === "dt assinatura") colMap["data_assinatura"] = idx;
      else if (col === "dt ini vig atual" || col === "dt ini 1a vig") colMap["data_inicio"] = idx;
      else if (col === "dt fim vig atual") colMap["data_fim"] = idx;
      else if (col === "caminho detalhamento contrato") colMap["link_tce"] = idx;
      else if (col === "tipo") colMap["modalidade"] = idx;
    });

    // Pega todos os contratos existentes (para não duplicar)
    const { data: existentes } = await supabase
      .schema("transparencia")
      .from("contratos_v2")
      .select("id, numero");

    const numMap = new Map<string, string>();
    if (existentes) {
      existentes.forEach((row) => {
        if (row.numero) {
          const match = row.numero.match(/(\d+)[/-](\d{4})/);
          if (match) numMap.set(`${parseInt(match[1], 10)}/${match[2]}`, row.id);
        }
      });
    }

    let inseridas = 0;
    let ignoradas = 0; // Contratos que já existem
    let comErros = 0;
    const erros: string[] = [];

    for (const row of rows) {
      try {
        const numero = colMap["numero"] !== undefined ? String(row[colMap["numero"]] || "").trim() : "";
        const processo = colMap["processo"] !== undefined ? String(row[colMap["processo"]] || "").trim() : "";
        const contratado = colMap["contratado"] !== undefined ? String(row[colMap["contratado"]] || "").trim() : "";
        const objeto = colMap["objeto"] !== undefined ? String(row[colMap["objeto"]] || "").trim() : "";
        const valorRaw = colMap["valor"] !== undefined ? row[colMap["valor"]] : null;
        const situacao = colMap["status"] !== undefined ? String(row[colMap["status"]] || "").trim() : "INDEFINIDA";
        const linkTce = colMap["link_tce"] !== undefined ? String(row[colMap["link_tce"]] || "").trim() : "";
        const modalidade = colMap["modalidade"] !== undefined ? String(row[colMap["modalidade"]] || "").trim() : "";
        
        let numeroLimpo = numero;
        const matchNum = numero.match(/(\d+)[/-](\d{4})/);
        if (matchNum) {
          numeroLimpo = `${matchNum[1].padStart(3, '0')}/${matchNum[2]}`;
        }

        if (!numeroLimpo && !objeto) continue; // Pula vazios

        // Check duplicidade
        let existingId: string | null = null;
        if (matchNum) {
          const key = `${parseInt(matchNum[1], 10)}/${matchNum[2]}`;
          if (numMap.has(key)) existingId = numMap.get(key)!;
        }

        if (existingId) {
          ignoradas++;
          continue;
        }

        const dataAssinatura = parseDate(colMap["data_assinatura"] !== undefined ? String(row[colMap["data_assinatura"]] || "") : "");
        const dataInicio = parseDate(colMap["data_inicio"] !== undefined ? String(row[colMap["data_inicio"]] || "") : "");
        const dataFim = parseDate(colMap["data_fim"] !== undefined ? String(row[colMap["data_fim"]] || "") : "");
        
        const anoStr = dataAssinatura?.split("-")[0] || (matchNum ? matchNum[2] : new Date().getFullYear().toString());
        const ano = parseInt(anoStr, 10);
        
        const valor = parseCurrency(valorRaw);

        const record = {
          ano: isNaN(ano) ? new Date().getFullYear() : ano,
          numero: numeroLimpo || null,
          processo: processo || null,
          contratado: contratado || null,
          objeto: objeto || null,
          valor: valor,
          situacao: normalizarSituacao(situacao) || null,
          data_assinatura: dataAssinatura,
          data_inicio: dataInicio,
          data_fim: dataFim,
          modalidade: normalizarModalidade(modalidade) || null,
          link_tce: linkTce || null,
        };

        const { error: insErr } = await supabase
          .schema("transparencia")
          .from("contratos_v2")
          .insert([record]);

        if (insErr) throw insErr;
        inseridas++;
        
      } catch (err: any) {
        comErros++;
        erros.push(`Linha com erro: ${err.message}`);
      }
    }

    return NextResponse.json({
      total: inseridas + ignoradas + comErros,
      inseridas,
      atualizadas: ignoradas, // O frontend trata "atualizadas" como "Ignoradas" visualmente
      comErros,
      erros,
    });
  } catch (error: any) {
    console.error("Erro na importação de contratos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
