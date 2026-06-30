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

export type PatientEditFormState = {
  message?: string;
};

const brazilianPhonePattern = /^\+55 \(\d{2}\) 9 \d{4}-\d{4}$/;
const initialOpportunityStatuses = [
  "aberta",
  "proposta_enviada",
  "aguardando_retorno",
];

export async function updatePatient(
  patientId: string,
  _previousState: PatientEditFormState,
  formData: FormData,
): Promise<PatientEditFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const leadSource = String(formData.get("lead_source") ?? "").trim();
  const mainInterest = String(formData.get("main_interest") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !phone) {
    return { message: "Nome e telefone sao obrigatorios." };
  }

  if (!brazilianPhonePattern.test(phone)) {
    return { message: "Use o telefone no formato +55 (47) 9 9999-9999." };
  }

  const { supabase } = await requireUser();
  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("phone", phone)
    .neq("id", patientId)
    .maybeSingle<{ id: string }>();

  if (existingPatient) {
    return { message: "Ja existe outro paciente cadastrado com este telefone." };
  }

  const { error } = await supabase
    .from("patients")
    .update({
      name,
      phone,
      lead_source: leadSource || null,
      main_interest: mainInterest || null,
      notes: notes || null,
    })
    .eq("id", patientId);

  if (error) {
    return { message: "Nao foi possivel atualizar o paciente." };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
  revalidatePath("/crm/atendimento");
  revalidatePath("/crm/oportunidades");
  revalidatePath("/crm/pacientes");
  revalidatePath(`/crm/pacientes/${patientId}`);
  redirect(`/crm/pacientes/${patientId}?salvo=paciente`);
}

export async function createContactLog(
  patientId: string,
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const channel = String(formData.get("channel") ?? "").trim();
  const returnType = String(formData.get("return_type") ?? "comercial").trim();
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
    return_type: returnType,
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
  const requestedStatus = String(formData.get("status") ?? "aberta").trim();
  const status = initialOpportunityStatuses.includes(requestedStatus)
    ? requestedStatus
    : "aberta";
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
