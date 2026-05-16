import { createClient } from '@supabase/supabase-js';

export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As variáveis de ambiente do Supabase não foram configuradas.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};
