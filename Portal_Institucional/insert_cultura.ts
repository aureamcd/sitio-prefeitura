import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cjvyxbblbolkucnbhfvr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdnl4YmJsYm9sa3VjbmJoZnZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyNTQ5NCwiZXhwIjoyMDkzMzAxNDk0fQ.V59Ed7neK85wxWhTdqt3dH1CF3-D3iJFs985OE919KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'transparencia' }
});

async function run() {
  // Verificando se a tabela existe / criando se no existir
  const sql = `
    CREATE TABLE IF NOT EXISTS transparencia.incentivos_cultura_esporte (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      projeto           TEXT NOT NULL,
      area              TEXT NOT NULL CHECK (area IN ('cultura', 'esporte')),
      beneficiario      TEXT NOT NULL,
      cpf_cnpj          TEXT,
      tipo_incentivo    TEXT NOT NULL,
      valor_beneficio   NUMERIC(14,2) NOT NULL,
      fundamento_legal  TEXT NOT NULL,
      ano               INTEGER NOT NULL,
      descricao         TEXT,
      created_at        TIMESTAMPTZ DEFAULT now(),
      updated_at        TIMESTAMPTZ DEFAULT now()
    );
  `;

  // We can't easily run arbitrary DDL through REST unless it's a function.
  // We'll just try to insert. If it fails, the user hasn't created the table.
  const records = [
    {
      projeto: 'Edital de Chamamento Público 001/2026 - PNAB',
      area: 'cultura',
      beneficiario: 'Agentes Culturais do Município (Em fase de seleção)',
      tipo_incentivo: 'patrocinio_abatimento',
      valor_beneficio: 30400.00,
      fundamento_legal: 'Lei 14.399/2022',
      ano: 2026,
      descricao: 'Premiação para agentes culturais com recursos da PNAB.'
    },
    {
      projeto: 'Edital de Chamamento Público 002/2026 - PNAB',
      area: 'cultura',
      beneficiario: 'Agentes Culturais do Município (Em fase de seleção)',
      tipo_incentivo: 'patrocinio_abatimento',
      valor_beneficio: 48675.00,
      fundamento_legal: 'Lei 14.399/2022',
      ano: 2026,
      descricao: 'Apoio a projetos de audiovisual e cinema.'
    },
    {
      projeto: 'Edital de Chamamento Público 001/2023 - SEMCULT',
      area: 'cultura',
      beneficiario: 'Agentes Culturais do Município',
      tipo_incentivo: 'patrocinio_abatimento',
      valor_beneficio: 50000.00, // Estimated/Placeholder
      fundamento_legal: 'Lei Paulo Gustavo',
      ano: 2023,
      descricao: 'Premiações Culturais'
    },
    {
      projeto: 'Edital de Chamamento Público 002/2023 - SEMCULT',
      area: 'cultura',
      beneficiario: 'Agentes Culturais do Município',
      tipo_incentivo: 'patrocinio_abatimento',
      valor_beneficio: 21300.00,
      fundamento_legal: 'Lei Complementar 195/2022',
      ano: 2023,
      descricao: 'Fomento a ações culturais de audiovisual.'
    },
    {
      projeto: 'Edital de Mapeamento Cultural 001/2024',
      area: 'cultura',
      beneficiario: 'Agentes Culturais do Município',
      tipo_incentivo: 'outro',
      valor_beneficio: 0.00, // Mapeamento usually has no direct value attached initially
      fundamento_legal: 'Lei Municipal de Cultura',
      ano: 2024,
      descricao: 'Mapeamento e Cadastro de Agentes Culturais'
    }
  ];

  const { data, error } = await supabase.from('incentivos_cultura_esporte').insert(records).select();
  
  if (error) {
    console.error('ERROR inserting:', error);
  } else {
    console.log('SUCCESS inserting:', data?.length, 'records');
  }
}

run();
