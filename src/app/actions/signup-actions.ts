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

  // O auth.users é criado pelo serviço de autenticação (GoTrue) e esse
  // insert aqui usa um client separado (service role) via PostgREST. Em
  // alguns casos a linha recém-criada em auth.users ainda não fica visível
  // pra esse segundo client no instante seguinte ao signUp — isso derruba o
  // insert com "violates foreign key constraint profiles_id_fkey" mesmo o
  // usuário sendo válido. Por isso: se for especificamente esse erro (FK,
  // código 23503), tenta de novo algumas vezes com um pequeno atraso antes
  // de desistir, em vez de falhar o cadastro na primeira tentativa.
  const MAX_ATTEMPTS = 4;
  let lastErrorMessage = "Erro desconhecido ao criar perfil.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: input.userId,
        email: input.email,
        full_name: input.fullName,
        role,
      });

    // 23505 = unique violation (perfil já existe) → tudo certo
    if (!error || error.code === "23505") {
      return { success: true };
    }

    lastErrorMessage = error.message;

    if (error.code === "23503" && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      continue;
    }

    return { success: false, error: lastErrorMessage };
  }

  return { success: false, error: lastErrorMessage };
}
