"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export type QuickActionState = {
  message?: string;
};

const brazilianPhonePattern = /^\+55 \(\d{2}\) 9 \d{4}-\d{4}$/;

export async function createQuickPatient(
  _previousState: QuickActionState,
  formData: FormData,
): Promise<QuickActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const leadSource = String(formData.get("lead_source") ?? "").trim();
  const mainInterest = String(formData.get("main_interest") ?? "").trim();

  if (!name || !phone) {
    return { message: "Nome e telefone sao obrigatorios." };
  }

  if (!brazilianPhonePattern.test(phone)) {
    return { message: "Use o telefone no formato +55 (47) 9 9999-9999." };
  }

  const { supabase, user } = await requireUser();
  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingPatient) {
    return { message: "Ja existe um paciente cadastrado com este telefone." };
  }

  const { error } = await supabase.from("patients").insert({
    name,
    phone,
    lead_source: leadSource || null,
    main_interest: mainInterest || null,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { message: "Ja existe um paciente cadastrado com este telefone." };
    }

    return { message: "Nao foi possivel cadastrar o paciente." };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/atendimento");
  revalidatePath("/crm/pacientes");
  redirect("/crm/atendimento?salvo=paciente");
}

export async function createQuickContact(
  _previousState: QuickActionState,
  formData: FormData,
): Promise<QuickActionState> {
  const patientId = String(formData.get("patient_id") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const patientObjection = String(formData.get("patient_objection") ?? "").trim();
  const nextAction = String(formData.get("next_action") ?? "").trim();
  const nextContactAt = String(formData.get("next_contact_at") ?? "").trim();
  const waitingPatientResponse = formData.get("waiting_patient_response") === "on";

  if (!patientId || !channel || !summary) {
    return { message: "Selecione o paciente, o canal e registre o resumo." };
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
  revalidatePath("/crm/atendimento");
  revalidatePath(`/crm/pacientes/${patientId}`);
  redirect("/crm/atendimento?salvo=contato");
}

export async function createQuickOpportunity(
  _previousState: QuickActionState,
  formData: FormData,
): Promise<QuickActionState> {
  const patientId = String(formData.get("patient_id") ?? "").trim();
  const suggestedProcedure = String(formData.get("suggested_procedure") ?? "").trim();
  const proposedValue = String(formData.get("proposed_value") ?? "").trim();
  const status = String(formData.get("status") ?? "aberta").trim();
  const expectedReturnAt = String(formData.get("expected_return_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!patientId || !suggestedProcedure) {
    return { message: "Selecione o paciente e informe o procedimento sugerido." };
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
  revalidatePath("/crm/atendimento");
  revalidatePath(`/crm/pacientes/${patientId}`);
  redirect("/crm/atendimento?salvo=oportunidade");
}
