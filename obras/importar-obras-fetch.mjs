/**
 * Importa obras para o Supabase via REST API
 * Sem dependências — usa apenas fetch() nativo do Node
 */
const SUPABASE_URL = 'https://nuhkqmuccirxumhttsvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGtxbXVjY2lyeHVtaHR0c3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDY0NjYsImV4cCI6MjA1OTMyMjQ2Nn0.6C2Wh2n9jjSlGJQz1-MQJsNcvRZn6TSFqJq8F6gPYbY';

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Content-Profile': 'transparencia',
};

function serialToDate(serial) {
  if (!serial || typeof serial !== 'number') return serial;
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

function parseBrDate(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function parseBrMoney(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ─── DADOS ───

// Planilha 2: obras.xlsx (detalhadas, com contratos, mais recentes)
const obrasDetalhadas = [
  {
    objeto: "Contratação de empresa especializada para construção de escola de ensino infantil na localidade Canto Alegre, no Município de Padre Marcos – PI.",
    localizacao: "Localidade Canto Alegre",
    situacao: "Em andamento",
    data_inicio: serialToDate(46034), // ≈ 2026-01-05
    data_previsao_fim: serialToDate(46335), // ≈ 2026-11-01
    empresa_responsavel: "S2E SERVIÇOS LTDA",
    cnpj_empresa: "47.643.407/0001-09",
    contrato_numero: "008/2026",
    licitacao: "CONCORRÊNCIA Nº 013/2025",
    ano: 2026,
  },
  {
    objeto: "Contratação de empresa especializada para execução da obra de reforma e ampliação da U.E. Cândida Macêdo, a ser realizada na zona urbana do Município de Padre Marcos – PI.",
    localizacao: "Zona Urbana",
    situacao: "Em andamento",
    data_inicio: serialToDate(46063), // ≈ 2026-02-03
    data_previsao_fim: serialToDate(46182), // ≈ 2026-06-01
    empresa_responsavel: "FAG CONSTRUCOES EVENTOS E SERVICOS LTDA- ME",
    cnpj_empresa: "10.786.555/0001-64",
    contrato_numero: "029/2026",
    licitacao: "CONCORRÊNCIA Nº 015/2025",
    ano: 2026,
  },
  {
    objeto: "Contratação de empresa especializada para a execução da obra de construção de unidades habitacionais no Município de Padre Marcos – PI, com recursos oriundos do Programa Minha Casa, Minha Vida – MCMV FNHIS Sub 50 (Proposta nº 040503/2025 e Convênio nº 987304/2025).",
    localizacao: "Sede do Município",
    situacao: "Em andamento",
    data_inicio: serialToDate(46101), // ≈ 2026-03-06
    data_previsao_fim: serialToDate(46346), // ≈ 2026-11-12
    empresa_responsavel: "IDEAL SERVIÇOS DE LIMPEZA E CONSTRÇÃO LTDA",
    cnpj_empresa: "25.079.729/0001-26",
    contrato_numero: "046/2026",
    licitacao: "CONCORRÊNCIA Nº 001/2026",
    ano: 2026,
  },
  {
    objeto: "Contratação de empresa especializada para a construção de CRECHE TIPO 1 na zona urbana do município de Padre Marcos – PI, conforme Proposta nº 003083/2024 e Convênio nº 962715/2024, firmados com o Fundo Nacional de Desenvolvimento da Educação – FNDE, do Ministério da Educação.",
    localizacao: "Zona Urbana",
    situacao: "Em andamento",
    data_inicio: serialToDate(45824), // ≈ 2025-06-13
    data_previsao_fim: serialToDate(46424), // ≈ 2027-02-01
    empresa_responsavel: 'BERNARDO GRANJA SOUSA "MM PLANEJADOS"',
    cnpj_empresa: "18.310.280/0001-08",
    contrato_numero: "098/2025",
    licitacao: "CONCORRÊNCIA Nº 004/2025",
    ano: 2025,
  },
  {
    objeto: "Contratação de empresa especializada para a execução da obra de construção da nova sede da Prefeitura Municipal de Padre Marcos – PI.",
    localizacao: "Sede do Município",
    situacao: "Em andamento",
    data_inicio: serialToDate(45861), // ≈ 2025-07-20
    data_previsao_fim: serialToDate(46349), // ≈ 2026-11-15
    empresa_responsavel: 'BERNARDO GRANJA SOUSA "MM PLANEJADOS"',
    cnpj_empresa: "18.310.280/0001-08",
    contrato_numero: "113/2025",
    licitacao: "CONCORRÊNCIA Nº 006/2025",
    ano: 2025,
  },
  {
    objeto: "Contratação de empresa especializada para a execução da obra de construção de praça pública e quiosques na sede do Município de Padre Marcos – PI.",
    localizacao: "Sede do Município",
    situacao: "Em andamento",
    data_inicio: serialToDate(45972), // ≈ 2025-11-08
    data_previsao_fim: serialToDate(46214), // ≈ 2026-07-01
    empresa_responsavel: "CRC CONSTRUÇÕES E TERRAPLANAGEM LTDA",
    cnpj_empresa: "36.426.568/0001-16",
    contrato_numero: "136/2025",
    licitacao: "CONCORRÊNCIA Nº 011/2025",
    ano: 2025,
  },
  {
    objeto: "Contratação de empresa especializada para a construção de escola em tempo integral na sede do município de Padre Marcos, PI – FNDE – escola de 9 salas, conforme Convênio nº 960708/2024 e Proposta nº 004119/2024, do Ministério da Educação.",
    localizacao: "Sede do Município",
    situacao: "Em andamento",
    data_inicio: serialToDate(45980), // ≈ 2025-11-16
    data_previsao_fim: serialToDate(46345), // ≈ 2026-11-11
    empresa_responsavel: "W J DE JESUS CAVALCANTE LTDA",
    cnpj_empresa: "32.098.679/0001-90",
    contrato_numero: "137/2025",
    licitacao: "CONCORRÊNCIA Nº 003/2025",
    ano: 2025,
  },
];

// Planilha 1: listagem_obras.xlsx (obras mais antigas, algumas de 2008)
const obrasListagem = [
  {
    objeto: "Contratação de empresa especializada para execução de obras de pavimentação asfáltica e drenagem de águas pluviais em diversas ruas da zona urbana do Município de Padre Marcos-PI",
    localizacao: "Zona Urbana",
    situacao: "Em andamento",
    data_inicio: "2025-06-06",
    data_previsao_fim: null,
    empresa_responsavel: "COMLIMA CONSTRUTORA LTDA",
    cnpj_empresa: null,
    contrato_numero: null,
    valor_total: 8623490.97,
    ano: 2025,
  },
  {
    objeto: "Contratação de empresa especializada para execução de obras de pavimentação asfáltica em diversas ruas da zona urbana do Município de Padre Marcos-PI",
    localizacao: "Zona Urbana",
    situacao: "Em andamento",
    data_inicio: "2025-06-16",
    data_previsao_fim: null,
    empresa_responsavel: 'BERNARDO GRANJA SOUSA "MM PLANEJADOS"',
    cnpj_empresa: "18.310.280/0001-08",
    contrato_numero: null,
    valor_total: 5542800.00,
    ano: 2025,
  },
  {
    objeto: "MÓDULOS SANITÁRIOS — Construção de módulos sanitários em comunidades rurais",
    localizacao: "Comunidades Rurais",
    situacao: "Em andamento",
    data_inicio: "2008-06-26",
    data_previsao_fim: null,
    empresa_responsavel: "CONSTRUTORA AVANÇO LTDA.",
    cnpj_empresa: null,
    contrato_numero: null,
    valor_total: 103100.00,
    ano: 2008,
  },
  {
    objeto: "REFORMA DAS ESTRADAS VICINAIS — Recuperação de estradas vicinais do município",
    localizacao: "Zona Rural",
    situacao: "Em andamento",
    data_inicio: "2008-06-16",
    data_previsao_fim: null,
    empresa_responsavel: "AMARO COELHO CONSTRUÇOES LTDA",
    cnpj_empresa: null,
    contrato_numero: null,
    valor_total: 144000.00,
    ano: 2008,
  },
  {
    objeto: "REFORMA DE PRAÇA — Reforma da praça da sede do município",
    localizacao: "Sede do Município",
    situacao: "Em andamento",
    data_inicio: "2008-05-27",
    data_previsao_fim: null,
    empresa_responsavel: "CONSTRUTORA MARCOS LTDA",
    cnpj_empresa: null,
    contrato_numero: null,
    valor_total: 41500.00,
    ano: 2008,
  },
  {
    objeto: "REFORMA E AMPLIAÇÃO DA QUADRA POLIESPORTIVA",
    localizacao: "Sede do Município",
    situacao: "Paralisada",
    data_inicio: "2008-06-18",
    data_previsao_fim: null,
    empresa_responsavel: "CONSTRUTORA MARCOS LTDA",
    cnpj_empresa: null,
    contrato_numero: null,
    valor_total: 50000.00,
    ano: 2008,
  },
];

// Combinar: obras detalhadas primeiro, depois listagem (evitando duplicatas)
const todasObras = [...obrasDetalhadas];

for (const obra of obrasListagem) {
  // Verifica se já existe pelos mesmos objeto + contratada
  const dup = todasObras.find(o => 
    o.objeto.substring(0, 40) === obra.objeto.substring(0, 40) &&
    o.empresa_responsavel === obra.empresa_responsavel
  );
  if (dup) {
    console.log(`⏭️  Duplicata ignorada: ${obra.objeto.substring(0, 60)}... (${obra.empresa_responsavel})`);
    continue;
  }
  todasObras.push(obra);
}

// ─── Função para consultar duplicata no banco ───
async function existeNoBanco(obra) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/obras?objeto=like.${encodeURIComponent(obra.objeto.substring(0, 80) + '%')}&empresa_responsavel=eq.${encodeURIComponent(obra.empresa_responsavel)}&select=id&limit=1`;
    const res = await fetch(url, { headers: { ...HEADERS, 'Prefer': 'count=exact' } });
    const data = await res.json();
    return data.length > 0;
  } catch {
    return false;
  }
}

// ─── Main ───
async function main() {
  console.log(`📊 Total de obras para processar: ${todasObras.length}`);
  console.log('');

  let inseridos = 0;
  let ignorados = 0;
  let erros = 0;

  for (let i = 0; i < todasObras.length; i++) {
    const obra = todasObras[i];
    process.stdout.write(`[${i + 1}/${todasObras.length}] ${obra.objeto.substring(0, 60)}... `);

    // Verifica duplicata no banco
    const existe = await existeNoBanco(obra);
    if (existe) {
      console.log(`⏭️  Já existe`);
      ignorados++;
      continue;
    }

    // Prepara payload
    const payload = {
      objeto: obra.objeto,
      localizacao: obra.localizacao || null,
      situacao: obra.situacao,
      data_inicio: obra.data_inicio || null,
      data_previsao_fim: obra.data_previsao_fim || null,
      empresa_responsavel: obra.empresa_responsavel,
      cnpj_empresa: obra.cnpj_empresa || null,
      valor_total: obra.valor_total || null,
      valor_executado: obra.valor_executado || null,
      percentual_executado: obra.percentual_executado || null,
      contrato_numero: obra.contrato_numero || null,
      empresa: '1',
      ano: obra.ano || 2026,
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/obras`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.log(`❌ Erro ${res.status}: ${errBody.substring(0, 100)}`);
        erros++;
      } else {
        console.log(`✅`);
        inseridos++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      erros++;
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n═══════════════════════════════');
  console.log('📊 RESUMO FINAL:');
  console.log(`   Total processadas: ${todasObras.length}`);
  console.log(`   Inseridas: ${inseridos}`);
  console.log(`   Já existiam: ${ignorados}`);
  console.log(`   Erros: ${erros}`);
  console.log('═══════════════════════════════');
}

main().catch(console.error);
