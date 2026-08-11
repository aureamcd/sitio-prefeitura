import PublicationPage from "@/components/layout/PublicationPage";
import { createServerClient } from "@/lib/supabase/server";

export const revalidate = 60;

const TIPOS = ["Lei", "Decreto", "Portaria", "Resolução", "Instrução Normativa"];

const TIPOS_MAP: Record<string, string[]> = {
    lei: [
        "lei",
        "lei-organica",
        "codigo-tributario",
        "plano-de-carreira",
        "plano-carreira",
        "regime-juridico"
    ],
    decreto: ["decreto"],
    portaria: ["portaria"],
    resolucao: [
        "resolucao",
        "regimento",
        "decisao"
    ],
    "instrucao-normativa": ["instrucao-normativa"],
};

const TIPO_NORM: Record<string, string> = {
    "lei": "Lei", "decreto": "Decreto", "portaria": "Portaria",
    "resolucao": "Resolução", "resolução": "Resolução",
    "instrucao normativa": "Instrução Normativa", "instrução normativa": "Instrução Normativa",
    "instrucao-normativa": "Instrução Normativa",
    "instrucao": "Instrução Normativa",
    "lei-organica": "Lei Orgânica",
    "codigo-postura": "Código de Postura",
    "codigo-tributario": "Código Tributário",
    "plano-de-carreira": "Plano de Carreira",
    "plano-carreira": "Plano de Carreira",
    "regime-juridico": "Regime Jurídico",
    "regimento": "Regimento",
    "decisao": "Decisão",
};

function normalizarTipo(tipo: string | null): string | undefined {
    if (!tipo) return undefined;
    return TIPO_NORM[tipo.toLowerCase()] ?? tipo;
}

export default async function LeisNormasPage() {
    const supabase = createServerClient();

    const [{ data: rows }, { data: latest }] = await Promise.all([
        supabase
            .from("legislacoes")
            .select("id, titulo, tipo, numero, ano, descricao, orgao, data_publicacao, arquivo_url, arquivo_r2_url, slug")
            .or("publicado.eq.true,publicado.is.null")
            .order("ano", { ascending: false })
            .order("numero", { ascending: false }),

        supabase
            .from("legislacoes")
            .select("updated_at")
            .or("publicado.eq.true,publicado.is.null")
            .order("updated_at", { ascending: false })
            .limit(1)
            .single(),
    ]);

    interface LegislacaoRow {
        id: string;
        titulo: string;
        tipo: string | null;
        numero: string | null;
        ano: number;
        descricao: string | null;
        orgao: string | null;
        data_publicacao: string | null;
        arquivo_url: string | null;
        arquivo_r2_url: string | null;
        slug: string | null;
    }

    const documentos = (rows ?? []).map((leg: LegislacaoRow) => ({
        id: leg.id,
        titulo: leg.titulo,
        tipo: leg.tipo || undefined, // Keep raw type for map filtering, we can display using normalizarTipo
        tipoExibicao: normalizarTipo(leg.tipo),
        numero: leg.numero ?? undefined,
        descricao: leg.descricao ?? undefined,
        orgao: leg.orgao ?? undefined,
        data: leg.data_publicacao
            ? (leg.data_publicacao.includes("/")
                ? leg.data_publicacao
                : new Date(leg.data_publicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" }))
            : leg.ano.toString(),
        dataISO: leg.data_publicacao
            ? (leg.data_publicacao.includes("/")
                ? leg.data_publicacao.split("/").reverse().join("-")
                : leg.data_publicacao)
            : undefined,
        arquivo: leg.arquivo_r2_url ?? leg.arquivo_url ?? "#",
        arquivo_r2_url: leg.arquivo_r2_url ?? undefined,
    }));

    return (
        <PublicationPage
            title="Leis e Normas"
            description="Consulte a legislação municipal, decretos, portarias e outros atos normativos."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Informações Institucionais", href: "/#secao-0" },
                { label: "Leis e Normas" },
            ]}
            lastUpdate={latest?.updated_at ?? ""}
            documentos={documentos as any}
            showTipoFiltro={true}
            tipos={TIPOS}
            tiposMap={TIPOS_MAP}
        />
    );
}
