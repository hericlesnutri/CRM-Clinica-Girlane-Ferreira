"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

export async function completeAgendaItem(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();

  if (!id || !type) {
    return;
  }

  const { supabase } = await requireUser();

  if (type === "contact") {
    await supabase
      .from("contact_logs")
      .update({
        next_contact_at: null,
        waiting_patient_response: false,
      })
      .eq("id", id);
  }

  if (type === "opportunity") {
    await supabase
      .from("opportunities")
      .update({
        status: "fechada",
        expected_return_at: null,
      })
      .eq("id", id);
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
}
