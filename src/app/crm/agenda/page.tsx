import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

type ContactReturn = {
  id: string;
  channel: string;
  summary: string;
  next_action: string | null;
  next_contact_at: string;
  patients: {
    id: string;
    name: string;
    phone: string;
  } | null;
};

type OpportunityReturn = {
  id: string;
  suggested_procedure: string;
  proposed_value: number | null;
  status: string;
  expected_return_at: string;
  patients: {
    id: string;
    name: string;
    phone: string;
  } | null;
};

type AgendaItem = {
  id: string;
  type: "contact" | "opportunity";
  patientId: string | null;
  patientName: string;
  patientPhone: string;
  title: string;
  description: string;
  scheduledAt: string;
  badge: string;
  value?: string;
};

export default async function AgendaPage() {
  const { supabase } = await requireUser();

  const [{ data: contactReturns }, { data: opportunityReturns }] = await Promise.all([
    supabase
      .from("contact_logs")
      .select("id, channel, summary, next_action, next_contact_at, patients(id, name, phone)")
      .not("next_contact_at", "is", null)
      .order("next_contact_at", { ascending: true })
      .returns<ContactReturn[]>(),
    supabase
      .from("opportunities")
      .select(
        "id, suggested_procedure, proposed_value, status, expected_return_at, patients(id, name, phone)",
      )
      .in("status", ["aberta", "proposta_enviada", "aguardando_retorno"])
      .not("expected_return_at", "is", null)
      .order("expected_return_at", { ascending: true })
      .returns<OpportunityReturn[]>(),
  ]);

  const agendaItems = [
    ...(contactReturns ?? []).map(contactToAgendaItem),
    ...(opportunityReturns ?? []).map(opportunityToAgendaItem),
  ].sort((a, b) => {
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  const groupedItems = {
    overdue: agendaItems.filter((item) => getAgendaGroup(item.scheduledAt) === "overdue"),
    today: agendaItems.filter((item) => getAgendaGroup(item.scheduledAt) === "today"),
    upcoming: agendaItems.filter((item) => getAgendaGroup(item.scheduledAt) === "upcoming"),
  };

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Agenda de retornos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Veja em um unico lugar os contatos e oportunidades que precisam de
              acompanhamento comercial.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037]"
            href="/crm/atendimento"
          >
            Registrar atendimento
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Atrasados" value={groupedItems.overdue.length} />
          <SummaryCard label="Hoje" value={groupedItems.today.length} />
          <SummaryCard label="Proximos" value={groupedItems.upcoming.length} />
        </div>

        <AgendaSection title="Atrasados" items={groupedItems.overdue} tone="danger" />
        <AgendaSection title="Hoje" items={groupedItems.today} tone="strong" />
        <AgendaSection title="Proximos retornos" items={groupedItems.upcoming} />
      </section>
    </main>
  );
}

function contactToAgendaItem(contact: ContactReturn): AgendaItem {
  return {
    id: contact.id,
    type: "contact",
    patientId: contact.patients?.id ?? null,
    patientName: contact.patients?.name ?? "Paciente removido",
    patientPhone: contact.patients?.phone ?? "Telefone nao disponivel",
    title: contact.next_action || `Contato por ${contact.channel}`,
    description: contact.summary,
    scheduledAt: contact.next_contact_at,
    badge: "Contato",
  };
}

function opportunityToAgendaItem(opportunity: OpportunityReturn): AgendaItem {
  return {
    id: opportunity.id,
    type: "opportunity",
    patientId: opportunity.patients?.id ?? null,
    patientName: opportunity.patients?.name ?? "Paciente removido",
    patientPhone: opportunity.patients?.phone ?? "Telefone nao disponivel",
    title: opportunity.suggested_procedure,
    description: opportunityStatusLabels[opportunity.status] ?? opportunity.status,
    scheduledAt: opportunity.expected_return_at,
    badge: "Oportunidade",
    value:
      opportunity.proposed_value === null
        ? undefined
        : Number(opportunity.proposed_value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
  };
}

function AgendaSection({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: AgendaItem[];
  tone?: "default" | "danger" | "strong";
}) {
  return (
    <section className="rounded-lg border border-[#dfd7cc] bg-white">
      <div className="flex items-center justify-between border-b border-[#dfd7cc] px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-[#5d5248]">{items.length}</span>
      </div>

      {items.length ? (
        <div className="divide-y divide-[#dfd7cc]">
          {items.map((item) => (
            <article key={`${item.type}-${item.id}`} className="px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={badgeClassName(tone)}>{item.badge}</span>
                    <p className="text-sm font-medium text-[#9e7f60]">
                      {formatDateTime(item.scheduledAt)}
                    </p>
                  </div>
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-[#5d5248]">
                    {item.patientName} - {item.patientPhone}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.value ? (
                    <span className="rounded-full bg-[#f5f3e7] px-3 py-1 text-xs font-medium">
                      {item.value}
                    </span>
                  ) : null}
                  {item.patientId ? (
                    <Link
                      className="inline-flex h-8 items-center rounded-lg border border-[#dfd7cc] px-3 text-xs font-medium transition hover:bg-[#f5f3e7]"
                      href={`/crm/pacientes/${item.patientId}`}
                    >
                      Abrir ficha
                    </Link>
                  ) : null}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6">{item.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-[#5d5248]">
          Nenhum retorno nesta categoria.
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-[#dfd7cc] bg-white p-5">
      <p className="text-sm text-[#5d5248]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function getAgendaGroup(scheduledAt: string) {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  if (scheduled < startOfToday) {
    return "overdue";
  }

  if (scheduled < startOfTomorrow) {
    return "today";
  }

  return "upcoming";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function badgeClassName(tone: "default" | "danger" | "strong") {
  const base = "rounded-full px-3 py-1 text-xs font-medium";

  if (tone === "danger") {
    return `${base} bg-red-50 text-red-700`;
  }

  if (tone === "strong") {
    return `${base} bg-[#333333] text-[#f5f3e7]`;
  }

  return `${base} bg-[#dfd7cc] text-[#333333]`;
}

const opportunityStatusLabels: Record<string, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};
