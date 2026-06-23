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

export async function registerAgendaEvolution(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const evolutionNote = String(formData.get("evolution_note") ?? "").trim();
  const nextReturnAt = String(formData.get("next_return_at") ?? "").trim();

  if (!id || !type || !evolutionNote || !nextReturnAt) {
    return;
  }

  const { supabase, user } = await requireUser();
  const nextReturnIso = new Date(nextReturnAt).toISOString();

  if (type === "contact") {
    const { data: contact } = await supabase
      .from("contact_logs")
      .select(
        "patient_id, contacted_by, channel, return_type, follow_up_group_id, summary, next_action",
      )
      .eq("id", id)
      .single<{
        patient_id: string;
        contacted_by: string | null;
        channel: string;
        return_type: string;
        follow_up_group_id: string | null;
        summary: string;
        next_action: string | null;
      }>();

    if (!contact) {
      return;
    }

    const evolvedSummary = `${contact.summary}\n\nEvolucao registrada: ${evolutionNote}`;

    if (contact.return_type === "pos_procedimento" && contact.follow_up_group_id) {
      await supabase
        .from("contact_logs")
        .update({
          next_contact_at: null,
          summary: evolvedSummary,
          waiting_patient_response: false,
        })
        .eq("id", id);

      const { data: nextFollowUp } = await supabase
        .from("contact_logs")
        .select("id")
        .eq("follow_up_group_id", contact.follow_up_group_id)
        .not("next_contact_at", "is", null)
        .neq("id", id)
        .order("next_contact_at", { ascending: true })
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (nextFollowUp) {
        await supabase
          .from("contact_logs")
          .update({ next_contact_at: nextReturnIso })
          .eq("id", nextFollowUp.id);
      } else {
        await supabase.from("contact_logs").insert({
          patient_id: contact.patient_id,
          contacted_by: user.id,
          channel: "Pos-procedimento",
          return_type: "pos_procedimento",
          follow_up_group_id: contact.follow_up_group_id,
          summary: `Acompanhamento adicional pos-procedimento.\n\nEvolucao anterior: ${evolutionNote}`,
          waiting_patient_response: false,
          next_action: contact.next_action || "Acompanhar recuperacao",
          next_contact_at: nextReturnIso,
        });
      }
    } else {
      await supabase
        .from("contact_logs")
        .update({
          next_contact_at: nextReturnIso,
          summary: evolvedSummary,
          waiting_patient_response: true,
        })
        .eq("id", id);
    }
  }

  if (type === "opportunity") {
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("notes")
      .eq("id", id)
      .single<{ notes: string | null }>();

    const evolvedNotes = [opportunity?.notes, `Evolucao registrada: ${evolutionNote}`]
      .filter(Boolean)
      .join("\n\n");

    await supabase
      .from("opportunities")
      .update({
        expected_return_at: nextReturnIso,
        notes: evolvedNotes,
        status: "aguardando_retorno",
      })
      .eq("id", id);
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
}
