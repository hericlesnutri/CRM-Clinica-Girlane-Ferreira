import Link from "next/link";
import { completeAgendaItem } from "./actions";
import { requireUser } from "@/lib/auth/require-user";

type ContactReturn = {
  id: string;
  channel: string;
  return_type: string;
  follow_up_group_id: string | null;
  summary: string;
  waiting_patient_response: boolean;
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
  cardKind: "general" | "waiting" | "postProcedure" | "opportunity";
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
      .select(
        "id, channel, return_type, follow_up_group_id, summary, waiting_patient_response, next_action, next_contact_at, patients(id, name, phone)",
      )
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
    ...filterVisibleContactReturns(contactReturns ?? []).map(contactToAgendaItem),
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

        <div className="grid gap-4 lg:grid-cols-3">
          <AgendaColumn title="Atrasados" items={groupedItems.overdue} tone="danger" />
          <AgendaColumn title="Hoje" items={groupedItems.today} tone="strong" />
          <AgendaColumn title="Proximos" items={groupedItems.upcoming} />
        </div>
      </section>
    </main>
  );
}

function contactToAgendaItem(contact: ContactReturn): AgendaItem {
  return {
    id: contact.id,
    type: "contact",
    cardKind: getContactCardKind(contact),
    patientId: contact.patients?.id ?? null,
    patientName: contact.patients?.name ?? "Paciente removido",
    patientPhone: contact.patients?.phone ?? "Telefone nao disponivel",
    title: contact.next_action || `Contato por ${contact.channel}`,
    description: contact.summary,
    scheduledAt: contact.next_contact_at,
    badge: contactReturnTypeLabels[contact.return_type] ?? "Contato",
  };
}

function filterVisibleContactReturns(contacts: ContactReturn[]) {
  const visibleContacts: ContactReturn[] = [];
  const postProcedureGroups = new Set<string>();

  for (const contact of contacts) {
    if (contact.return_type !== "pos_procedimento" || !contact.follow_up_group_id) {
      visibleContacts.push(contact);
      continue;
    }

    if (postProcedureGroups.has(contact.follow_up_group_id)) {
      continue;
    }

    postProcedureGroups.add(contact.follow_up_group_id);
    visibleContacts.push(contact);
  }

  return visibleContacts;
}

function opportunityToAgendaItem(opportunity: OpportunityReturn): AgendaItem {
  return {
    id: opportunity.id,
    type: "opportunity",
    cardKind: "opportunity",
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

function AgendaColumn({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: AgendaItem[];
  tone?: "default" | "danger" | "strong";
}) {
  return (
    <section className="flex min-h-[28rem] flex-col rounded-lg border border-[#dfd7cc] bg-white">
      <div className="flex items-center justify-between border-b border-[#dfd7cc] px-4 py-4">
        <h2 className="font-semibold">{title}</h2>
        <span className={countClassName(tone)}>{items.length}</span>
      </div>

      {items.length ? (
        <div className="flex flex-1 flex-col gap-3 bg-[#f8f6ee] p-3">
          {items.map((item) => (
            <article
              key={`${item.type}-${item.id}`}
              className={cardClassName(item.cardKind, tone)}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={badgeClassName(item.cardKind)}>{item.badge}</span>
                    <p className="text-xs font-medium text-[#9e7f60]">
                      {formatDateTime(item.scheduledAt)}
                    </p>
                  </div>
                  <h3 className="mt-3 font-semibold leading-6">{item.title}</h3>
                  <p className="mt-1 text-sm text-[#5d5248]">
                    {item.patientName} - {item.patientPhone}
                  </p>
                  </div>
                  <form action={completeAgendaItem}>
                    <input name="id" type="hidden" value={item.id} />
                    <input name="type" type="hidden" value={item.type} />
                    <button
                      className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[#333333] px-3 text-xs font-medium text-[#f5f3e7] transition hover:bg-[#4a4037]"
                      type="submit"
                    >
                      Concluir
                    </button>
                  </form>
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
              <p className="mt-4 line-clamp-4 text-sm leading-6">{item.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-[#f8f6ee] px-5 py-8 text-center text-sm text-[#5d5248]">
          Nenhum retorno nesta categoria.
        </div>
      )}
    </section>
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

function getContactCardKind(contact: ContactReturn): AgendaItem["cardKind"] {
  if (contact.return_type === "pos_procedimento") {
    return "postProcedure";
  }

  if (contact.return_type === "aguardando_retorno" || contact.waiting_patient_response) {
    return "waiting";
  }

  return "general";
}

function cardClassName(
  cardKind: AgendaItem["cardKind"],
  columnTone: "default" | "danger" | "strong",
) {
  const base = "rounded-lg border p-4 shadow-sm";
  const overdue = columnTone === "danger" ? " ring-1 ring-red-200" : "";

  if (cardKind === "opportunity") {
    return `${base} border-amber-300 bg-amber-50${overdue}`;
  }

  if (cardKind === "waiting") {
    return `${base} border-sky-300 bg-sky-50${overdue}`;
  }

  if (cardKind === "postProcedure") {
    return `${base} border-emerald-300 bg-emerald-50${overdue}`;
  }

  return `${base} border-[#dfd7cc] bg-white${overdue}`;
}

function badgeClassName(cardKind: AgendaItem["cardKind"]) {
  const base = "rounded-full px-3 py-1 text-xs font-medium";

  if (cardKind === "opportunity") {
    return `${base} bg-amber-200 text-amber-900`;
  }

  if (cardKind === "waiting") {
    return `${base} bg-sky-200 text-sky-900`;
  }

  if (cardKind === "postProcedure") {
    return `${base} bg-emerald-200 text-emerald-900`;
  }

  return `${base} bg-[#dfd7cc] text-[#333333]`;
}

function countClassName(tone: "default" | "danger" | "strong") {
  const base = "rounded-full px-3 py-1 text-xs font-semibold";

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

const contactReturnTypeLabels: Record<string, string> = {
  comercial: "Comercial",
  aguardando_retorno: "Aguardando retorno",
  pos_procedimento: "Pos-procedimento",
};
