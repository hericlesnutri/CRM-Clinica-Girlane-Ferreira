import Link from "next/link";
import { notFound } from "next/navigation";
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
  return_type: string;
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

type PatientProcedure = {
  procedure_name: string;
  performed_at: string | null;
  notes: string | null;
  created_at: string;
};

const opportunityStatusLabels: Record<string, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};

const contactReturnTypeLabels: Record<string, string> = {
  comercial: "Comercial",
  aguardando_retorno: "Aguardando retorno",
  pos_procedimento: "Pos-procedimento",
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
      "id, channel, return_type, summary, patient_objection, waiting_patient_response, next_action, next_contact_at, created_at, profiles(full_name)",
    )
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .returns<ContactLog[]>();

  const { data: latestProcedure } = await supabase
    .from("patient_procedures")
    .select("procedure_name, performed_at, notes, created_at")
    .eq("patient_id", patient.id)
    .order("performed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PatientProcedure>();

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

            <div className="mt-5 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                Ultimo procedimento
              </p>
              {latestProcedure ? (
                <div className="mt-2">
                  <p className="font-semibold">{latestProcedure.procedure_name}</p>
                  <p className="mt-1 text-sm text-[#496356]">
                    {latestProcedure.performed_at
                      ? new Date(latestProcedure.performed_at).toLocaleDateString("pt-BR")
                      : "Data nao informada"}
                  </p>
                  {latestProcedure.notes ? (
                    <p className="mt-3 text-sm leading-6 text-[#496356]">
                      {latestProcedure.notes}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#496356]">
                  Nenhum procedimento realizado registrado ainda.
                </p>
              )}
            </div>

            {patient.notes ? (
              <p className="mt-5 rounded-lg bg-[#f5f3e7] p-4 text-sm leading-6 text-[#5d5248]">
                {patient.notes}
              </p>
            ) : null}
          </div>
        </div>

        <section className="rounded-lg border border-[#dfd7cc] bg-white">
          <div className="border-b border-[#dfd7cc] px-5 py-4">
            <h2 className="font-semibold">Oportunidades e propostas</h2>
          </div>

          {opportunities?.length ? (
            <div className="grid gap-3 bg-[#f8f6ee] p-3">
              {opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-lg border border-amber-300 bg-amber-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-semibold">{opportunity.suggested_procedure}</h3>
                      <p className="mt-1 text-sm text-[#5d5248]">
                        Criada em{" "}
                        {new Date(opportunity.created_at).toLocaleString("pt-BR")} por{" "}
                        {opportunity.profiles?.full_name ?? "Equipe"}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900">
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

        <section className="rounded-lg border border-[#dfd7cc] bg-white">
          <div className="border-b border-[#dfd7cc] px-5 py-4">
            <h2 className="font-semibold">Historico de contatos</h2>
          </div>

          {contactLogs?.length ? (
            <div className="grid gap-3 bg-[#f8f6ee] p-3">
              {contactLogs.map((contact) => {
                const { mainText, completionText } = splitCompletionNote(contact.summary);

                return (
                <article key={contact.id} className={contactCardClassName(contact)}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{contact.channel}</p>
                        <span className={contactBadgeClassName(contact)}>
                          {contactReturnTypeLabels[contact.return_type] ?? "Comercial"}
                        </span>
                      </div>
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

                  <p className="mt-4 whitespace-pre-line text-sm leading-6">{mainText}</p>

                  {completionText ? (
                    <div className="mt-4 rounded-lg border border-[#9e7f60]/30 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60]">
                        Conclusao do retorno
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6">
                        {completionText}
                      </p>
                    </div>
                  ) : null}

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
                );
              })}
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

function splitCompletionNote(summary: string) {
  const marker = "Conclusao do retorno:";
  const [mainText, completionText] = summary.split(marker);

  return {
    mainText: mainText.trim(),
    completionText: completionText?.trim() ?? "",
  };
}

function contactCardClassName(contact: ContactLog) {
  const base = "rounded-lg border p-4";

  if (contact.return_type === "pos_procedimento") {
    return `${base} border-emerald-300 bg-emerald-50`;
  }

  if (contact.return_type === "aguardando_retorno" || contact.waiting_patient_response) {
    return `${base} border-sky-300 bg-sky-50`;
  }

  return `${base} border-[#dfd7cc] bg-white`;
}

function contactBadgeClassName(contact: ContactLog) {
  const base = "rounded-full px-3 py-1 text-xs font-medium";

  if (contact.return_type === "pos_procedimento") {
    return `${base} bg-emerald-200 text-emerald-900`;
  }

  if (contact.return_type === "aguardando_retorno" || contact.waiting_patient_response) {
    return `${base} bg-sky-200 text-sky-900`;
  }

  return `${base} bg-[#dfd7cc] text-[#333333]`;
}
