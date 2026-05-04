import PublicationPage from "@/components/layout/PublicationPage";

const documentos = [
  {
    id: 1,
    titulo: "Convocação para audiência sobre o Plano Diretor Municipal",
    tipo: "Convocação",
    data: "15/04/2026",
    arquivo: "/docs/editais/convocacao-plano-diretor-2026.pdf",
  },
  {
    id: 2,
    titulo: "Chamamento público para organizações da sociedade civil",
    tipo: "Chamamento Público",
    data: "10/04/2026",
    arquivo: "/docs/editais/chamamento-osc-2026.pdf",
  },
  {
    id: 3,
    titulo: "Processo Seletivo Simplificado nº 001/2026 — Agentes de Saúde",
    tipo: "Processo Seletivo",
    data: "01/03/2026",
    arquivo: "/docs/editais/pss-001-2026.pdf",
  },
  {
    id: 4,
    titulo: "Audiência Pública — Prestação de Contas do 1º Trimestre de 2026",
    tipo: "Audiência Pública",
    data: "20/02/2026",
    arquivo: "/docs/editais/audiencia-contas-2026.pdf",
  },
  {
    id: 5,
    titulo: "Edital de seleção de projetos culturais — Lei Paulo Gustavo",
    tipo: "Cultura / Esporte / Programas",
    data: "05/02/2026",
    arquivo: "/docs/editais/cultura-lpg-2026.pdf",
  },
  {
    id: 6,
    titulo: "Convocação dos aprovados no Concurso Público nº 001/2025",
    tipo: "Convocação",
    data: "10/12/2025",
    arquivo: "/docs/editais/convocacao-concurso-2025.pdf",
  },
  {
    id: 7,
    titulo: "Chamamento público para credenciamento de oficineiros de esporte",
    tipo: "Chamamento Público",
    data: "15/11/2025",
    arquivo: "/docs/editais/chamamento-esporte-2025.pdf",
  },
  {
    id: 8,
    titulo: "Processo Seletivo Simplificado nº 002/2025 — Professores temporários",
    tipo: "Processo Seletivo",
    data: "20/08/2025",
    arquivo: "/docs/editais/pss-002-2025.pdf",
  },
];

export default function EditaisPage() {
  return (
    <PublicationPage
      title="Editais"
      description="Publicação de editais de convocação, chamamentos públicos, processos seletivos e audiências públicas."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Publicações Oficiais" },
        { label: "Editais" },
      ]}
      lastUpdate="2026-05-04"
      responsavel="Comissão Permanente de Licitação"
      documentos={documentos}
      showTipoFiltro
      tipos={[
        "Convocação",
        "Chamamento Público",
        "Processo Seletivo",
        "Audiência Pública",
        "Cultura / Esporte / Programas",
      ]}
    />
  );
}
