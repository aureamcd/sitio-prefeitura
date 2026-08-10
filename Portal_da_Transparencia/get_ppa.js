const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cjvyxbblbolkucnbhfvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdnl4YmJsYm9sa3VjbmJoZnZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyNTQ5NCwiZXhwIjoyMDkzMzAxNDk0fQ.V59Ed7neK85wxWhTdqt3dH1CF3-D3iJFs985OE919KE'
);
async function run() {
  const { data, error } = await supabase.schema('transparencia').from('planejamento_documentos').select('*').eq('categoria', 'PLANEJAMENTO_ORCAMENTARIO');
  console.log('Result:', data);
  if (error) console.error('Error:', error);
}
run();
