import Link from "next/link";
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
      <section className="flex w-full flex-col gap-5 py-5 lg:py-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Pacientes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Busque uma ficha, veja historico e continue o atendimento com
              mais contexto.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#c96f61] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85f52]"
            href="/crm/atendimento"
          >
            Novo paciente
          </Link>
        </div>

        <PatientsList patients={patients ?? []} />
      </section>
    </main>
  );
}
