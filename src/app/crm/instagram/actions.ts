"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

const validStatuses = ["novo", "em_atendimento", "concluido", "arquivado"];

export async function updateInstagramCardStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !validStatuses.includes(status)) {
    return;
  }

  const { supabase } = await requireUser();
  const handledAt =
    status === "concluido" || status === "arquivado"
      ? new Date().toISOString()
      : null;

  await supabase
    .from("instagram_inbox_cards")
    .update({
      handled_at: handledAt,
      status,
    })
    .eq("id", id);

  revalidatePath("/crm");
  revalidatePath("/crm/instagram");
}
