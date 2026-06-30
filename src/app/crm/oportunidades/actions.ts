"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

const validStatuses = [
  "aberta",
  "proposta_enviada",
  "aguardando_retorno",
  "fechada",
  "perdida",
];

export async function updateOpportunityStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const closedValue = String(formData.get("closed_value") ?? "").trim();

  if (!id || !validStatuses.includes(status)) {
    return;
  }

  const numericClosedValue =
    status === "fechada" ? parseCurrencyValue(closedValue) : null;

  if (status === "fechada" && numericClosedValue === null) {
    return;
  }

  const { supabase } = await requireUser();
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("patient_id, status")
    .eq("id", id)
    .single<{ patient_id: string; status: string }>();

  if (opportunity?.status === "fechada" || opportunity?.status === "perdida") {
    return;
  }

  const shouldClearReturn = status === "fechada" || status === "perdida";
  const payload: {
    closed_value?: number | null;
    expected_return_at?: null;
    status: string;
  } = { status };

  if (shouldClearReturn) {
    payload.expected_return_at = null;
  }

  if (status === "fechada") {
    payload.closed_value = numericClosedValue;
  }

  if (status === "perdida") {
    payload.closed_value = null;
  }

  await supabase
    .from("opportunities")
    .update(payload)
    .eq("id", id);

  revalidatePath("/crm");
  revalidatePath("/crm/agenda");
  revalidatePath("/crm/oportunidades");

  if (opportunity?.patient_id) {
    revalidatePath(`/crm/pacientes/${opportunity.patient_id}`);
  }
}

function parseCurrencyValue(value: string) {
  if (!value) {
    return null;
  }

  const numericValue = Number(value.replace(/\./g, "").replace(",", "."));

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return numericValue;
}
