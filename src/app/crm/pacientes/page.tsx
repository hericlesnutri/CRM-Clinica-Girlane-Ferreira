import Link from "next/link";
import { PatientForm } from "./patient-form";
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

        <section className="rounded-lg border border-[#dfd7cc] bg-white">
          <div className="border-b border-[#dfd7cc] px-5 py-4">
            <h2 className="font-semibold">Pacientes cadastrados</h2>
          </div>

          {patients?.length ? (
            <div className="divide-y divide-[#dfd7cc]">
              {patients.map((patient) => (
                <article key={patient.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr]">
                  <div>
                    <Link
                      className="font-semibold transition hover:text-[#9e7f60]"
                      href={`/crm/pacientes/${patient.id}`}
                    >
                      {patient.name}
                    </Link>
                    <p className="mt-1 text-sm text-[#5d5248]">{patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9e7f60]">
                      Interesse
                    </p>
                    <p className="mt-1 text-sm">{patient.main_interest ?? "Nao informado"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9e7f60]">
                      Origem
                    </p>
                    <p className="mt-1 text-sm">{patient.lead_source ?? "Nao informada"}</p>
                  </div>
                  {patient.notes ? (
                    <p className="md:col-span-3 text-sm leading-6 text-[#5d5248]">
                      {patient.notes}
                    </p>
                  ) : null}
                  <div className="md:col-span-3">
                    <Link
                      className="inline-flex h-9 items-center rounded-lg border border-[#dfd7cc] px-3 text-sm font-medium transition hover:bg-[#f5f3e7]"
                      href={`/crm/pacientes/${patient.id}`}
                    >
                      Abrir ficha
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[#5d5248]">
              Nenhum paciente cadastrado ainda.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
