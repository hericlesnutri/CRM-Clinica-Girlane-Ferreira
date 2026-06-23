"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

const brazilianPhonePattern = /^\+55 \(\d{2}\) 9 \d{4}-\d{4}$/;

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

  if (!brazilianPhonePattern.test(phone)) {
    return {
      message: "Use o telefone no formato brasileiro: +55 (47) 9 9999-9999.",
    };
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
    notes: notes || null,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { message: "Ja existe um paciente cadastrado com este telefone." };
    }

    return { message: "Nao foi possivel cadastrar o paciente." };
  }

  revalidatePath("/crm");
  revalidatePath("/crm/pacientes");
  redirect("/crm/pacientes");
}
