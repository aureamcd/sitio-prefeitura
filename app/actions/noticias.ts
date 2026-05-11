"use server";

import { createServerClient } from "@/lib/supabase/server";

export async function aprovarNoticia(id: string, email: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("noticias")
    .update({ status: "publicado" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function rejeitarNoticia(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("noticias")
    .update({ status: "rejeitado" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function arquivarNoticia(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("noticias")
    .update({ status: "arquivado" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function atualizarNoticia(id: string, dados: any) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("noticias")
    .update(dados)
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function inserirNoticia(dados: any, email: string) {
  const supabase = createServerClient();
  
  // Ensures we have an ID and Data
  if (!dados.id) dados.id = crypto.randomUUID();
  if (!dados.data) dados.data = new Date().toISOString();

  const { error } = await supabase.from("noticias").insert([dados]);

  if (error) throw new Error(error.message);
  return { success: true };
}
