import PublicationPage from "@/components/layout/PublicationPage";
import { createServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

const CATEGORIAS = [
  "Diário Oficial e Boletins",
  "Avisos e Comunicados",
  "Editais e Chamamentos Gerais",
  "Atas e Registros Diversos"
];

const CATEGORIA_MAP: Record<string, string[]> = {
  "diario-oficial-e-boletins": ["boletim", "nota", "despacho"],
  "avisos-e-comunicados": ["comunicado", "oficio", "calendario", "politica", "notificacao", "artigo"],
  "editais-e-chamamentos-gerais": ["edital"],
  "atas-e-registros-diversos": ["ata", "termo-posse", "protocolo", "questionario", "requerimento"]
};

export default async function PublicacoesOficiaisPage() {
    const supabase = createServerClient();

    const [{ data: rows }, { data: latest }] = await Promise.all([
        supabase
            .from("publicacoes")
            .select("id, titulo, tipo, numero, ano, descricao, data_publicacao, arquivo_url, arquivo_r2_url, created_at")
            .order("ano", { ascending: false })
            .order("numero", { ascending: false }),

        supabase
            .from("publicacoes")
            .select("created_at")
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
    ]);

    const documentos = (rows ?? []).map((pub) => ({
        id: pub.id,
        titulo: pub.titulo,
        tipo: pub.tipo || undefined,
        tipoExibicao: pub.tipo,
        numero: pub.numero ?? undefined,
        descricao: pub.descricao ?? undefined,
        orgao: undefined, // Orgao no longer available in schema
        data: pub.data_publicacao
            ? (pub.data_publicacao.includes("/") ? pub.data_publicacao : new Date(pub.data_publicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" }))
            : pub.ano ? pub.ano.toString() : "—",
        dataISO: pub.data_publicacao
            ? (pub.data_publicacao.includes("/") ? pub.data_publicacao.split("/").reverse().join("-") : pub.data_publicacao)
            : pub.ano ? pub.ano.toString() : undefined,
        arquivo: pub.arquivo_r2_url ?? pub.arquivo_url ?? "#",
        arquivo_r2_url: pub.arquivo_r2_url ?? undefined,
    }));

    return (
        <PublicationPage
            title="Publicações Oficiais"
            description="Consulte editais, atas, avisos e outras publicações oficiais do município."
            breadcrumb={[
                { label: "Início", href: "/" },
                { label: "Publicações Oficiais" },
            ]}
            lastUpdate={latest?.created_at ?? ""}
            documentos={documentos as any}
            showTipoFiltro={true}
            tipos={CATEGORIAS}
            tiposMap={CATEGORIA_MAP}
        />
    );
}
