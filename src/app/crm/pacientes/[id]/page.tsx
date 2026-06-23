import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactForm } from "./contact-form";
import { OpportunityForm } from "./opportunity-form";
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

type ContactLog = {
  id: string;
  channel: string;
  summary: string;
  patient_objection: string | null;
  waiting_patient_response: boolean;
  next_action: string | null;
  next_contact_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
};

type Opportunity = {
  id: string;
  suggested_procedure: string;
  proposed_value: number | null;
  status: string;
  expected_return_at: string | null;
  notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
};

const opportunityStatusLabels: Record<string, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};

export default async function PatientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, phone, lead_source, main_interest, notes, created_at")
    .eq("id", id)
    .single<Patient>();

  if (!patient) {
    notFound();
  }

  const { data: contactLogs } = await supabase
    .from("contact_logs")
    .select(
      "id, channel, summary, patient_objection, waiting_patient_response, next_action, next_contact_at, created_at, profiles(full_name)",
    )
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .returns<ContactLog[]>();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, suggested_procedure, proposed_value, status, expected_return_at, notes, created_at, profiles(full_name)",
    )
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .returns<Opportunity[]>();

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div>
          <Link className="text-sm font-medium text-[#9e7f60]" href="/crm/pacientes">
            Voltar aos pacientes
          </Link>
          <div className="mt-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold">{patient.name}</h1>
                <p className="mt-2 text-[#5d5248]">{patient.phone}</p>
              </div>
              <div className="rounded-lg bg-[#f5f3e7] px-4 py-3 text-sm">
                <p className="font-medium">Interesse principal</p>
                <p className="mt-1 text-[#5d5248]">
                  {patient.main_interest ?? "Nao informado"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoItem label="Origem" value={patient.lead_source ?? "Nao informada"} />
              <InfoItem
                label="Cadastrado em"
                value={new Date(patient.created_at).toLocaleDateString("pt-BR")}
              />
            </div>

            {patient.notes ? (
              <p className="mt-5 rounded-lg bg-[#f5f3e7] p-4 text-sm leading-6 text-[#5d5248]">
                {patient.notes}
              </p>
            ) : null}
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Nova oportunidade</h2>
          <OpportunityForm patientId={patient.id} />
        </section>

        <section className="rounded-lg border border-[#dfd7cc] bg-white">
          <div className="border-b border-[#dfd7cc] px-5 py-4">
            <h2 className="font-semibold">Oportunidades e propostas</h2>
          </div>

          {opportunities?.length ? (
            <div className="divide-y divide-[#dfd7cc]">
              {opportunities.map((opportunity) => (
                <article key={opportunity.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-semibold">{opportunity.suggested_procedure}</h3>
                      <p className="mt-1 text-sm text-[#5d5248]">
                        Criada em{" "}
                        {new Date(opportunity.created_at).toLocaleString("pt-BR")} por{" "}
                        {opportunity.profiles?.full_name ?? "Equipe"}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#dfd7cc] px-3 py-1 text-xs font-medium text-[#333333]">
                      {opportunityStatusLabels[opportunity.status] ?? opportunity.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <InfoItem
                      label="Valor"
                      value={
                        opportunity.proposed_value === null
                          ? "Nao informado"
                          : Number(opportunity.proposed_value).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                      }
                    />
                    <InfoItem
                      label="Retorno previsto"
                      value={
                        opportunity.expected_return_at
                          ? new Date(opportunity.expected_return_at).toLocaleString("pt-BR")
                          : "Nao agendado"
                      }
                    />
                    <InfoItem
                      label="Responsavel"
                      value={opportunity.profiles?.full_name ?? "Equipe"}
                    />
                  </div>

                  {opportunity.notes ? (
                    <p className="mt-4 text-sm leading-6 text-[#5d5248]">
                      {opportunity.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[#5d5248]">
              Nenhuma oportunidade registrada para este paciente.
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Novo contato</h2>
          <ContactForm patientId={patient.id} />
        </section>

        <section className="rounded-lg border border-[#dfd7cc] bg-white">
          <div className="border-b border-[#dfd7cc] px-5 py-4">
            <h2 className="font-semibold">Historico de contatos</h2>
          </div>

          {contactLogs?.length ? (
            <div className="divide-y divide-[#dfd7cc]">
              {contactLogs.map((contact) => (
                <article key={contact.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{contact.channel}</p>
                      <p className="mt-1 text-sm text-[#5d5248]">
                        {new Date(contact.created_at).toLocaleString("pt-BR")} por{" "}
                        {contact.profiles?.full_name ?? "Equipe"}
                      </p>
                    </div>
                    {contact.waiting_patient_response ? (
                      <span className="w-fit rounded-full bg-[#dfd7cc] px-3 py-1 text-xs font-medium text-[#333333]">
                        Aguardando retorno
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-6">{contact.summary}</p>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <InfoItem
                      label="Objecao"
                      value={contact.patient_objection ?? "Nao registrada"}
                    />
                    <InfoItem
                      label="Proxima acao"
                      value={contact.next_action ?? "Nao definida"}
                    />
                    <InfoItem
                      label="Proximo contato"
                      value={
                        contact.next_contact_at
                          ? new Date(contact.next_contact_at).toLocaleString("pt-BR")
                          : "Nao agendado"
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[#5d5248]">
              Nenhum contato registrado para este paciente.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9e7f60]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#5d5248]">{value}</p>
    </div>
  );
}
