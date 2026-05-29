import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractDigits(code: string): string {
  return code.replace(/[^\d]/g, '');
}

function padCode(clean: string): string {
  return clean.padEnd(10, '0').slice(0, 10);
}

function formatCodigo(clean: string): string {
  return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean[6]}.${clean[7]}.${clean.slice(8, 10)}`;
}

function normalizeCodigo(codigo: string): string {
  return formatCodigo(padCode(extractDigits(codigo)));
}

function computeParentSafe(codigo: string): string | null {
  const digits = extractDigits(codigo).padEnd(10, '0').slice(0, 10);

  const groups = [
    { start: 0, size: 1 }, // Categoria
    { start: 1, size: 1 }, // Origem
    { start: 2, size: 1 }, // Espécie
    { start: 3, size: 1 }, // Rubrica
    { start: 4, size: 2 }, // Alínea
    { start: 6, size: 1 }, // Subalínea
    { start: 7, size: 1 }, // Desdobramento 1
    { start: 8, size: 2 }, // Detalhamento
  ];

  let deepestNonZero = -1;
  for (let i = 0; i < groups.length; i++) {
    const g = digits.slice(groups[i].start, groups[i].start + groups[i].size);
    if (g !== '0'.repeat(groups[i].size)) {
      deepestNonZero = i;
    }
  }

  if (deepestNonZero <= 0) return null;

  const parent = digits.split('');
  for (let i = groups[deepestNonZero].start; i < digits.length; i++) {
    parent[i] = '0';
  }

  return formatCodigo(parent.join(''));
}

async function run() {
  const { data } = await supabase.from('receitas').select('*').eq('ano', 2026);
  console.log('Total rows for 2026:', data.length);

  const nodeMap = new Map();
  for (const item of data) {
    const key = normalizeCodigo(item.codigo_contabil);
    if (nodeMap.has(key)) {
      const exist = nodeMap.get(key);
      exist.arrecadado += Number(item.arrecadado_total) || 0;
    } else {
      nodeMap.set(key, { codigo: key, arrecadado: Number(item.arrecadado_total) || 0, filhos: [] });
    }
  }

  const roots: any[] = [];
  const childrenMap = new Map();

  for (const [code, node] of nodeMap) {
    let parentCode = computeParentSafe(code);
    const findExisting = (p: string | null): string | null => {
      if (!p) return null;
      if (nodeMap.has(p)) return p;
      return findExisting(computeParentSafe(p));
    };
    const anc = findExisting(parentCode);
    if (anc) {
      if (!childrenMap.has(anc)) childrenMap.set(anc, []);
      childrenMap.get(anc).push(node);
    } else {
      roots.push(node);
    }
  }

  for (const [p, c] of childrenMap) {
    nodeMap.get(p).filhos = c;
  }

  function sumTotals(n: any) {
    if (n.filhos.length === 0) return;
    let arrF = 0;
    for (const c of n.filhos) {
      sumTotals(c);
      arrF += c.arrecadado;
    }
    n.arrecadado = arrF;
  }

  for (const r of roots) sumTotals(r);

  const root1 = nodeMap.get('1000.00.0.0.00');
  console.log('Receitas Correntes (1000):', root1?.arrecadado);

  if (root1) {
    let sumL2 = 0;
    for (const c of root1.filhos) {
      console.log(`  -> Filho L2: ${c.codigo} | Valor: ${c.arrecadado}`);
      sumL2 += c.arrecadado;
    }
    console.log(`  => Soma dos Filhos L2: ${sumL2} (Igual a Receitas Correntes? ${sumL2 === root1.arrecadado})`);
  }
}
run();
