"use server";

import { createClient } from "@supabase/supabase-js";

const allowedSignupRoles = new Set(["CLIENT", "PHOTOGRAPHER", "PRODUCER"]);

// DB enum uses 'user' for regular clients
const roleMap: Record<string, string> = {
  CLIENT: "user",
  PHOTOGRAPHER: "PHOTOGRAPHER",
  PRODUCER: "PRODUCER",
};

type SignupRole = "CLIENT" | "PHOTOGRAPHER" | "PRODUCER";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase admin environment variables are missing");
  }

  return createClient(url, key);
}

export async function createSignupProfile(input: {
  userId: string;
  email: string;
  fullName: string;
  role: SignupRole;
}) {
  const inputRole = allowedSignupRoles.has(input.role) ? input.role : "CLIENT";
  const role = roleMap[inputRole] ?? "user";

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return { success: false, error: "Configuração do servidor incompleta." };
  }

  const { error } = await supabase
    .from("profiles")
    .insert({
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
      role,
    });

  // 23505 = unique violation (perfil já existe) → tudo certo
  if (error && error.code !== "23505") {
    return { success: false, error: error.message };
  }

  return { success: true };
}
