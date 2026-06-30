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
      .select("notes, patient_id, proposed_value")
      .eq("id", id)
      .single<{ notes: string | null; patient_id: string; proposed_value: number | null }>();

    const completedNotes = completionNote
      ? [opportunity?.notes, `Conclusao do retorno: ${completionNote}`]
          .filter(Boolean)
          .join("\n\n")
      : opportunity?.notes;

    await supabase
      .from("opportunities")
      .update({
        closed_at: new Date().toISOString(),
        closed_value: opportunity?.proposed_value ?? null,
        status: "fechada",
        expected_return_at: null,
        lost_at: null,
        notes: completedNotes,
      })
      .eq("id", id);

    if (opportunity?.patient_id) {
      revalidatePath(`/crm/pacientes/${opportunity.patient_id}`);
    }
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
  revalidatePath("/crm/oportunidades");
}

export async function registerAgendaEvolution(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const evolutionNote = String(formData.get("evolution_note") ?? "").trim();
  const nextReturnAt = String(formData.get("next_return_at") ?? "").trim();

  if (!id || !type || !evolutionNote) {
    return;
  }

  const { supabase, user } = await requireUser();
  const nextReturnIso = nextReturnAt ? new Date(nextReturnAt).toISOString() : null;

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

      if (nextReturnIso) {
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
      }
    } else {
      await supabase
        .from("contact_logs")
        .update({
          next_contact_at: nextReturnIso,
          summary: evolvedSummary,
          waiting_patient_response: Boolean(nextReturnIso),
        })
        .eq("id", id);
    }
  }

  if (type === "opportunity") {
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("notes, patient_id, proposed_value")
      .eq("id", id)
      .single<{ notes: string | null; patient_id: string; proposed_value: number | null }>();

    const evolvedNotes = [opportunity?.notes, `Evolucao registrada: ${evolutionNote}`]
      .filter(Boolean)
      .join("\n\n");

    await supabase
      .from("opportunities")
      .update({
        closed_at: nextReturnIso ? null : new Date().toISOString(),
        closed_value: nextReturnIso ? null : (opportunity?.proposed_value ?? null),
        expected_return_at: nextReturnIso,
        lost_at: null,
        notes: evolvedNotes,
        status: nextReturnIso ? "aguardando_retorno" : "fechada",
      })
      .eq("id", id);

    if (opportunity?.patient_id) {
      revalidatePath(`/crm/pacientes/${opportunity.patient_id}`);
    }
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
  revalidatePath("/crm/oportunidades");
  revalidatePath("/crm/relatorios");
}
