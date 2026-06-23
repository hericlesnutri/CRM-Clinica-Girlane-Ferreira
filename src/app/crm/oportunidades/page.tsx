import Link from "next/link";
import { EvolutionDialog } from "../agenda/evolution-dialog";
import { updateOpportunityStatus } from "./actions";
import { requireUser } from "@/lib/auth/require-user";

type Opportunity = {
  id: string;
  suggested_procedure: string;
  proposed_value: number | null;
  status: OpportunityStatus;
  expected_return_at: string | null;
  notes: string | null;
  created_at: string;
  patients: {
    id: string;
    name: string;
    phone: string;
  } | null;
};

type OpportunityStatus =
  | "aberta"
  | "proposta_enviada"
  | "aguardando_retorno"
  | "fechada"
  | "perdida";

type FunnelColumn = {
  description: string;
  status: OpportunityStatus;
  title: string;
};

const funnelColumns: FunnelColumn[] = [
  {
    description: "Interesse identificado, mas ainda sem proposta final.",
    status: "aberta",
    title: "Aberta",
  },
  {
    description: "Proposta enviada para avaliacao da paciente.",
    status: "proposta_enviada",
    title: "Proposta enviada",
  },
  {
    description: "Precisa de retorno ativo do comercial.",
    status: "aguardando_retorno",
    title: "Aguardando retorno",
  },
  {
    description: "Negociacoes convertidas em agendamento ou venda.",
    status: "fechada",
    title: "Fechada",
  },
  {
    description: "Oportunidades que nao avancaram neste momento.",
    status: "perdida",
    title: "Perdida",
  },
];

export default async function OpportunitiesPage() {
  const { supabase } = await requireUser();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, suggested_procedure, proposed_value, status, expected_return_at, notes, created_at, patients(id, name, phone)",
    )
    .order("created_at", { ascending: false })
    .returns<Opportunity[]>();

  const items = opportunities ?? [];
  const openValue = items
    .filter((opportunity) => !["fechada", "perdida"].includes(opportunity.status))
    .reduce((total, opportunity) => total + Number(opportunity.proposed_value ?? 0), 0);
  const wonValue = items
    .filter((opportunity) => opportunity.status === "fechada")
    .reduce((total, opportunity) => total + Number(opportunity.proposed_value ?? 0), 0);

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Funil de oportunidades</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Acompanhe propostas em aberto, retornos comerciais e oportunidades
              fechadas em um formato de CRM/Kanban.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037]"
            href="/crm/atendimento"
          >
            Nova oportunidade
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Oportunidades" value={String(items.length)} />
          <SummaryCard label="Valor em aberto" value={formatCurrency(openValue)} />
          <SummaryCard label="Valor fechado" value={formatCurrency(wonValue)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          {funnelColumns.map((column) => {
            const columnItems = items.filter(
              (opportunity) => opportunity.status === column.status,
            );
            const columnValue = columnItems.reduce((total, opportunity) => {
              return total + Number(opportunity.proposed_value ?? 0);
            }, 0);

            return (
              <FunnelColumn
                column={column}
                items={columnItems}
                key={column.status}
                totalValue={columnValue}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#dfd7cc] bg-white p-5">
      <p className="text-sm text-[#5d5248]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function FunnelColumn({
  column,
  items,
  totalValue,
}: {
  column: FunnelColumn;
  items: Opportunity[];
  totalValue: number;
}) {
  return (
    <section className="flex min-h-[32rem] flex-col rounded-lg border border-[#dfd7cc] bg-white">
      <div className="border-b border-[#dfd7cc] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{column.title}</h2>
          <span className={countClassName(column.status)}>{items.length}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#5d5248]">{column.description}</p>
        <p className="mt-3 text-sm font-semibold text-[#9e7f60]">
          {formatCurrency(totalValue)}
        </p>
      </div>

      {items.length ? (
        <div className="flex flex-1 flex-col gap-3 bg-[#f8f6ee] p-3">
          {items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-[#f8f6ee] px-5 py-8 text-center text-sm text-[#5d5248]">
          Nenhuma oportunidade nesta etapa.
        </div>
      )}
    </section>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className={cardClassName(opportunity.status)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={badgeClassName(opportunity.status)}>
            {statusLabels[opportunity.status]}
          </span>
          <h3 className="mt-3 font-semibold leading-6">
            {opportunity.suggested_procedure}
          </h3>
        </div>
        <EvolutionDialog itemId={opportunity.id} itemType="opportunity" />
      </div>

      <p className="mt-2 text-sm leading-6 text-[#5d5248]">
        {opportunity.patients?.name ?? "Paciente removido"} -{" "}
        {opportunity.patients?.phone ?? "Telefone nao disponivel"}
      </p>

      <div className="mt-4 grid gap-2 text-sm">
        <InfoLine label="Valor" value={formatCurrency(opportunity.proposed_value)} />
        <InfoLine
          label="Retorno"
          value={
            opportunity.expected_return_at
              ? formatDateTime(opportunity.expected_return_at)
              : "Nao agendado"
          }
        />
      </div>

      {opportunity.notes ? (
        <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-6">
          {opportunity.notes}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {opportunity.patients ? (
          <Link
            className="inline-flex h-8 items-center rounded-lg border border-[#dfd7cc] px-3 text-xs font-medium transition hover:bg-[#f5f3e7]"
            href={`/crm/pacientes/${opportunity.patients.id}`}
          >
            Abrir ficha
          </Link>
        ) : null}

        {statusActions
          .filter((action) => action.status !== opportunity.status)
          .map((action) => (
            <StatusButton
              id={opportunity.id}
              key={action.status}
              status={action.status}
              title={action.title}
            />
          ))}
      </div>
    </article>
  );
}

function StatusButton({
  id,
  status,
  title,
}: {
  id: string;
  status: OpportunityStatus;
  title: string;
}) {
  return (
    <form action={updateOpportunityStatus}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />
      <button
        className="inline-flex h-8 items-center rounded-lg border border-[#dfd7cc] px-3 text-xs font-medium transition hover:bg-[#f5f3e7]"
        type="submit"
      >
        {title}
      </button>
    </form>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#5d5248]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatCurrency(value: number | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function cardClassName(status: OpportunityStatus) {
  const base = "rounded-lg border p-4 shadow-sm";

  if (status === "fechada") {
    return `${base} border-emerald-300 bg-emerald-50`;
  }

  if (status === "perdida") {
    return `${base} border-red-200 bg-red-50`;
  }

  if (status === "aguardando_retorno") {
    return `${base} border-sky-300 bg-sky-50`;
  }

  return `${base} border-amber-300 bg-amber-50`;
}

function badgeClassName(status: OpportunityStatus) {
  const base = "rounded-full px-3 py-1 text-xs font-medium";

  if (status === "fechada") {
    return `${base} bg-emerald-200 text-emerald-900`;
  }

  if (status === "perdida") {
    return `${base} bg-red-100 text-red-800`;
  }

  if (status === "aguardando_retorno") {
    return `${base} bg-sky-200 text-sky-900`;
  }

  return `${base} bg-amber-200 text-amber-900`;
}

function countClassName(status: OpportunityStatus) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold";

  if (status === "fechada") {
    return `${base} bg-emerald-100 text-emerald-800`;
  }

  if (status === "perdida") {
    return `${base} bg-red-50 text-red-700`;
  }

  if (status === "aguardando_retorno") {
    return `${base} bg-sky-100 text-sky-800`;
  }

  return `${base} bg-amber-100 text-amber-800`;
}

const statusLabels: Record<OpportunityStatus, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};

const statusActions: Array<{ status: OpportunityStatus; title: string }> = [
  { status: "aberta", title: "Abrir" },
  { status: "proposta_enviada", title: "Proposta" },
  { status: "aguardando_retorno", title: "Aguardar" },
  { status: "fechada", title: "Fechar" },
  { status: "perdida", title: "Perder" },
];
