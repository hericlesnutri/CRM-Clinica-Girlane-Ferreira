"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export type ContactFormState = {
  message?: string;
};

export type OpportunityFormState = {
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

export async function createOpportunity(
  patientId: string,
  _previousState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const suggestedProcedure = String(formData.get("suggested_procedure") ?? "").trim();
  const proposedValue = String(formData.get("proposed_value") ?? "").trim();
  const status = String(formData.get("status") ?? "aberta").trim();
  const expectedReturnAt = String(formData.get("expected_return_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!suggestedProcedure) {
    return { message: "Informe o procedimento sugerido." };
  }

  const numericValue = proposedValue
    ? Number(proposedValue.replace(/\./g, "").replace(",", "."))
    : null;

  if (numericValue !== null && Number.isNaN(numericValue)) {
    return { message: "Informe um valor de proposta valido." };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("opportunities").insert({
    patient_id: patientId,
    suggested_procedure: suggestedProcedure,
    proposed_value: numericValue,
    status,
    expected_return_at: expectedReturnAt
      ? new Date(expectedReturnAt).toISOString()
      : null,
    owner_id: user.id,
    notes: notes || null,
  });

  if (error) {
    return { message: "Nao foi possivel registrar a oportunidade." };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/pacientes");
  revalidatePath(`/crm/pacientes/${patientId}`);
  redirect(`/crm/pacientes/${patientId}`);
}
