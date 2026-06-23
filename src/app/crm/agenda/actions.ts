"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

export async function completeAgendaItem(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const completionNote = String(formData.get("completion_note") ?? "").trim();

  if (!id || !type) {
    return;
  }

  const { supabase } = await requireUser();

  if (type === "contact") {
    const { data: contact } = await supabase
      .from("contact_logs")
      .select("summary")
      .eq("id", id)
      .single<{ summary: string }>();

    const completedSummary = completionNote
      ? `${contact?.summary ?? ""}\n\nConclusao do retorno: ${completionNote}`
      : contact?.summary;

    await supabase
      .from("contact_logs")
      .update({
        next_contact_at: null,
        waiting_patient_response: false,
        summary: completedSummary,
      })
      .eq("id", id);
  }

  if (type === "opportunity") {
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("notes")
      .eq("id", id)
      .single<{ notes: string | null }>();

    const completedNotes = completionNote
      ? [opportunity?.notes, `Conclusao do retorno: ${completionNote}`]
          .filter(Boolean)
          .join("\n\n")
      : opportunity?.notes;

    await supabase
      .from("opportunities")
      .update({
        status: "fechada",
        expected_return_at: null,
        notes: completedNotes,
      })
      .eq("id", id);
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
}
