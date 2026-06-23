import Link from "next/link";
import { QuickForms } from "./quick-forms";
import { requireUser } from "@/lib/auth/require-user";

type SearchParams = {
  paciente?: string;
  salvo?: string;
};

type PatientOption = {
  id: string;
  name: string;
  phone: string;
};

export default async function CommercialDeskPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { paciente, salvo } = await searchParams;
  const { supabase } = await requireUser();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, phone")
    .order("name", { ascending: true })
    .returns<PatientOption[]>();

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Central comercial</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Registre contatos e oportunidades em uma unica tela, sem precisar
              abrir a ficha completa do paciente a cada atendimento.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dfd7cc] bg-white px-4 text-sm font-medium transition hover:bg-[#f5f3e7]"
            href="/crm/pacientes"
          >
            Ver lista de pacientes
          </Link>
        </div>

        {salvo ? <SuccessMessage patientId={paciente} type={salvo} /> : null}

        <QuickForms patients={patients ?? []} />
      </section>
    </main>
  );
}

const successMessages: Record<string, string> = {
  paciente: "Paciente cadastrado com sucesso.",
  contato: "Contato registrado com sucesso.",
  oportunidade: "Oportunidade registrada com sucesso.",
  pos_procedimento: "Sequencia de acompanhamento pos-procedimento criada com sucesso.",
};

function SuccessMessage({
  patientId,
  type,
}: {
  patientId?: string;
  type: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 md:flex-row md:items-center md:justify-between">
      <p className="font-medium">
        {successMessages[type] ?? "Registro salvo com sucesso."}
      </p>

      <div className="flex flex-wrap gap-2">
        {patientId ? (
          <Link
            className="inline-flex h-9 items-center rounded-lg border border-emerald-300 bg-white px-3 font-medium text-emerald-900 transition hover:bg-emerald-100"
            href={`/crm/pacientes/${patientId}`}
          >
            Abrir ficha
          </Link>
        ) : null}

        <Link
          className="inline-flex h-9 items-center rounded-lg border border-emerald-300 bg-white px-3 font-medium text-emerald-900 transition hover:bg-emerald-100"
          href="/crm/agenda"
        >
          Ver agenda
        </Link>
      </div>
    </div>
  );
}
