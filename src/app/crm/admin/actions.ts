"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

type AppRole = "admin" | "recepcionista" | "comercial";

const validRoles: AppRole[] = ["admin", "recepcionista", "comercial"];

export async function updateTeamMember(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as AppRole;

  if (!id || !fullName || !validRoles.includes(role)) {
    return;
  }

  const { supabase, user } = await requireUser();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: AppRole }>();

  if (currentProfile?.role !== "admin") {
    return;
  }

  if (id === user.id && role !== "admin") {
    const { count: adminCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((adminCount ?? 0) <= 1) {
      return;
    }
  }

  await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
    })
    .eq("id", id);

  revalidatePath("/crm");
  revalidatePath("/crm/admin");
}
