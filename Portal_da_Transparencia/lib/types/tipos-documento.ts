export const TIPOS_LEGISLACAO = [
  "Lei", "Lei Orgânica", "Código Tributário", "Plano de Carreira",
  "Regime Jurídico", "Decreto", "Portaria", "Resolução", "Regimento",
  "Decisão", "Instrução Normativa",
] as const;

export const TIPOS_PUBLICACAO = [
  "Boletim", "Nota", "Despacho", "Comunicado", "Ofício", "Calendário",
  "Política", "Notificação", "Artigo", "Edital", "Ata", "Termo-posse",
  "Protocolo", "Questionário", "Requerimento",
] as const;

export type CategoriaForm = "leis-normas" | "publicacoes-oficiais";

export const CATEGORIA_TABELA: Record<CategoriaForm, string> = {
  "leis-normas": "legislacoes",
  "publicacoes-oficiais": "publicacoes",
};

export const CATEGORIA_LABEL: Record<CategoriaForm, string> = {
  "leis-normas": "Leis e Normas",
  "publicacoes-oficiais": "Publicações Oficiais",
};
