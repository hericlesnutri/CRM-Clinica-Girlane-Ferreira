"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export type PatientFormState = {
  message?: string;
};

export async function createPatient(
  _previousState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const leadSource = String(formData.get("lead_source") ?? "").trim();
  const mainInterest = String(formData.get("main_interest") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !phone) {
    return { message: "Nome e telefone sao obrigatorios." };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("patients").insert({
    name,
    phone,
    lead_source: leadSource || null,
    main_interest: mainInterest || null,
    notes: notes || null,
    created_by: user.id,
  });

  if (error) {
    return { message: "Nao foi possivel cadastrar o paciente." };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/pacientes");
  redirect("/crm/pacientes");
}
