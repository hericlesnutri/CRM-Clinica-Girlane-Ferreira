import Link from "next/link";
import { PatientForm } from "./patient-form";
import { PatientsList } from "./patients-list";
import { requireUser } from "@/lib/auth/require-user";

type Patient = {
  id: string;
  name: string;
  phone: string;
  lead_source: string | null;
  main_interest: string | null;
  notes: string | null;
  created_at: string;
};

export default async function PatientsPage() {
  const { supabase } = await requireUser();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, phone, lead_source, main_interest, notes, created_at")
    .order("created_at", { ascending: false })
    .returns<Patient[]>();

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Pacientes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Cadastre pacientes e mantenha os primeiros dados comerciais
              organizados para novos contatos.
            </p>
          </div>
        </div>

        <PatientForm />

        <PatientsList patients={patients ?? []} />
      </section>
    </main>
  );
}
