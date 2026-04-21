"use server";

import { createClient } from "@/utils/supabase/server";

export async function verifyEventPassword(eventId: string, passwordAttempt: string) {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("password")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return { success: false, message: "Evento não encontrado" };
  }

  if (event.password === passwordAttempt) {
    return { success: true };
  }

  return { success: false, message: "Senha incorreta" };
}
