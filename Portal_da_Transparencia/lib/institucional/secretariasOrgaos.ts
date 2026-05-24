import portalData from "../data/portal.json";

type Item = {
  slug: string;
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  horario: string;
  endereco: string;
  competencias: string[];
  servicos: string[];
  planos: any[];
  cargo?: string;
};

// Mapeia as secretarias e órgãos do JSON para o formato esperado pelo resto do sistema
const transformData = () => {
  const data: Record<string, any> = {};

  portalData.secretarias.forEach((s: any) => {
    data[s.slug] = {
      ...s,
      tipo: "secretaria",
      cargo: "Secretário(a)"
    };
  });

  portalData.orgaos.forEach((o: any) => {
    data[o.slug] = {
      ...o,
      tipo: "orgao",
      cargo: o.nome.includes("Controladoria") ? "Controlador(a)" : "Procurador(a)"
    };
  });

  return data;
};

export const secretariasOrgaos = transformData();
