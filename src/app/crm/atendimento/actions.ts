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
  const returnType = String(formData.get("return_type") ?? "comercial").trim();
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

export async function createPostProcedureFollowUp(
  _previousState: QuickActionState,
  formData: FormData,
): Promise<QuickActionState> {
  const patientId = String(formData.get("patient_id") ?? "").trim();
  const procedureName = String(formData.get("procedure_name") ?? "").trim();
  const performedAt = String(formData.get("performed_at") ?? "").trim();
  const nextContactAt = String(formData.get("next_contact_at") ?? "").trim();
  const followUpDays = Number(formData.get("follow_up_days") ?? 3);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!patientId || !procedureName || !nextContactAt) {
    return {
      message: "Selecione o paciente, informe o procedimento e agende o retorno.",
    };
  }

  if (!Number.isInteger(followUpDays) || followUpDays < 1 || followUpDays > 10) {
    return { message: "Informe uma sequencia entre 1 e 10 dias de acompanhamento." };
  }

  const { supabase, user } = await requireUser();

  const { error: procedureError } = await supabase.from("patient_procedures").insert({
    patient_id: patientId,
    procedure_name: procedureName,
    performed_at: performedAt || null,
    notes: notes || null,
  });

  if (procedureError) {
    return { message: "Nao foi possivel registrar o procedimento realizado." };
  }

  const baseSummary = [
    performedAt
      ? `Procedimento realizado em ${new Date(performedAt).toLocaleDateString("pt-BR")}.`
      : null,
    notes || null,
  ]
    .filter(Boolean)
    .join(" ");

  const firstContactDate = new Date(nextContactAt);
  const followUps = Array.from({ length: followUpDays }, (_, index) => {
    const scheduledAt = new Date(firstContactDate);
    scheduledAt.setDate(firstContactDate.getDate() + index);

    const dayNumber = index + 1;
    const summary = [
      `Acompanhamento pos-procedimento D+${dayNumber}: ${procedureName}.`,
      baseSummary || null,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      patient_id: patientId,
      contacted_by: user.id,
      channel: "Pos-procedimento",
      return_type: "pos_procedimento",
      summary,
      waiting_patient_response: false,
      next_action: `D+${dayNumber} - acompanhar recuperacao: ${procedureName}`,
      next_contact_at: scheduledAt.toISOString(),
    };
  });

  const { error: contactError } = await supabase
    .from("contact_logs")
    .insert(followUps);

  if (contactError) {
    return {
      message: "Procedimento salvo, mas nao foi possivel agendar os retornos.",
    };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
  revalidatePath("/crm/atendimento");
  revalidatePath(`/crm/pacientes/${patientId}`);
  redirect("/crm/atendimento?salvo=pos_procedimento");
}

export async function createCommercialRecord(
  _previousState: QuickActionState,
  formData: FormData,
): Promise<QuickActionState> {
  const recordType = String(formData.get("record_type") ?? "").trim();

  if (recordType === "contato") {
    return createQuickContact(_previousState, formData);
  }

  if (recordType === "oportunidade") {
    return createQuickOpportunity(_previousState, formData);
  }

  if (recordType === "pos_procedimento") {
    return createPostProcedureFollowUp(_previousState, formData);
  }

  return { message: "Selecione o tipo de registro comercial." };
}
