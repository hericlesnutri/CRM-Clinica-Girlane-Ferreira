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

  if (!id || !validStatuses.includes(status)) {
    return;
  }

  const { supabase } = await requireUser();
  const shouldClearReturn = status === "fechada" || status === "perdida";
  const payload: { expected_return_at?: null; status: string } = { status };
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("patient_id")
    .eq("id", id)
    .single<{ patient_id: string }>();

  if (shouldClearReturn) {
    payload.expected_return_at = null;
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
