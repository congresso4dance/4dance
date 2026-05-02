"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const ADMIN_ROLES = ["owner", "admin", "editor", "assistant"];

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!ADMIN_ROLES.includes(profile?.role || "")) {
    redirect("/");
  }

  return supabase;
}

function getRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createTestimonial(formData: FormData) {
  const supabase = await assertAdmin();

  const author = getRequiredText(formData, "author");
  const role = getRequiredText(formData, "role");
  const content = getRequiredText(formData, "content");
  const avatarUrl = getRequiredText(formData, "avatar_url");

  if (!author || !content) {
    redirect("/admin/testimonials?status=missing");
  }

  const { error } = await supabase.from("testimonials").insert({
    author,
    role: role || null,
    content,
    avatar_url: avatarUrl || null,
  });

  if (error) {
    redirect(`/admin/testimonials?status=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials?status=created");
}

export async function deleteTestimonial(formData: FormData) {
  const supabase = await assertAdmin();
  const id = getRequiredText(formData, "id");

  if (!id) {
    redirect("/admin/testimonials?status=missing");
  }

  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) {
    redirect(`/admin/testimonials?status=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials?status=deleted");
}
