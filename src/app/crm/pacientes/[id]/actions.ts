"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export type ContactFormState = {
  message?: string;
};

export async function createContactLog(
  patientId: string,
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const channel = String(formData.get("channel") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const patientObjection = String(formData.get("patient_objection") ?? "").trim();
  const nextAction = String(formData.get("next_action") ?? "").trim();
  const nextContactAt = String(formData.get("next_contact_at") ?? "").trim();
  const waitingPatientResponse = formData.get("waiting_patient_response") === "on";

  if (!channel || !summary) {
    return { message: "Canal e resumo da conversa sao obrigatorios." };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("contact_logs").insert({
    patient_id: patientId,
    contacted_by: user.id,
    channel,
    summary,
    patient_objection: patientObjection || null,
    waiting_patient_response: waitingPatientResponse,
    next_action: nextAction || null,
    next_contact_at: nextContactAt ? new Date(nextContactAt).toISOString() : null,
  });

  if (error) {
    return { message: "Nao foi possivel registrar o contato." };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/pacientes");
  revalidatePath(`/crm/pacientes/${patientId}`);
  redirect(`/crm/pacientes/${patientId}`);
}
