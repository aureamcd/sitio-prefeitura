import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data, error } = await supabase.schema('transparencia').from('planejamento_documentos').select('id, titulo').eq('tipo', 'RGF');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const doc of data) {
    let newTitle = doc.titulo;
    // Replace "LRF RGF X Semestre YYYY" with "RGF —"
    if (newTitle.startsWith('LRF RGF')) {
      const parts = newTitle.split(' ');
      const semestre = parts[2]; // 1 ou 2
      const ano = parts[4]; // 2022
      let anexo = '';
      
      // Encontrar "ANEXO XX"
      const anexoIdx = parts.indexOf('ANEXO');
      if (anexoIdx !== -1) {
        anexo = `Anexo ${parseInt(parts[anexoIdx + 1], 10)}: `;
        let desc = parts.slice(anexoIdx + 2).join(' ').replace(/ pag \d+$/, '');
        if (desc.startsWith('PESSOAL A')) desc = 'Despesa com Pessoal (Parte A)';
        else if (desc.startsWith('PESSOAL B')) desc = 'Despesa com Pessoal (Parte B)';
        else if (desc.startsWith('PESSOAL')) desc = 'Despesa com Pessoal';
        else if (desc.startsWith('DIVIDA')) desc = 'Dívida Consolidada Líquida';
        else if (desc.startsWith('GARANTIAS')) desc = 'Garantias e Contragarantias';
        else if (desc.startsWith('OP CREDITO')) desc = 'Operações de Crédito';
        else if (desc.startsWith('DISPONIBILIDADE A')) desc = 'Disponibilidade de Caixa e Restos a Pagar (Parte A)';
        else if (desc.startsWith('DISPONIBILIDADE B')) desc = 'Disponibilidade de Caixa e Restos a Pagar (Parte B)';
        else if (desc.startsWith('DISPONIBILIDADE')) desc = 'Disponibilidade de Caixa e Restos a Pagar';
        else if (desc.startsWith('SIMPLIFICADO A')) desc = 'Demonstrativo Simplificado do RGF (Parte A)';
        else if (desc.startsWith('SIMPLIFICADO B')) desc = 'Demonstrativo Simplificado do RGF (Parte B)';
        else if (desc.startsWith('SIMPLIFICADO')) desc = 'Demonstrativo Simplificado do RGF';
        
        newTitle = `RGF — ${anexo}${desc} — ${semestre}º Semestre (${ano})`;
      } else {
        newTitle = `RGF — ${semestre}º Semestre (${ano})`;
      }
      
      console.log(`Updating: ${doc.titulo} -> ${newTitle}`);
      await supabase.schema('transparencia').from('planejamento_documentos').update({ titulo: newTitle }).eq('id', doc.id);
    }
  }
}
run();
