import Link from "next/link";
import { updateInstagramCardStatus } from "./actions";
import { requireUser } from "@/lib/auth/require-user";

type InstagramCard = {
  id: string;
  instagram_sender_id: string;
  sender_username: string | null;
  sender_name: string | null;
  message_text: string;
  status: InstagramCardStatus;
  received_at: string;
  handled_at: string | null;
};

type InstagramCardStatus = "novo" | "em_atendimento" | "concluido" | "arquivado";

const statusLabels: Record<InstagramCardStatus, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  concluido: "Concluido",
  arquivado: "Arquivado",
};

const columns: Array<{ status: InstagramCardStatus; title: string }> = [
  { status: "novo", title: "Novos" },
  { status: "em_atendimento", title: "Em atendimento" },
  { status: "concluido", title: "Concluidos" },
  { status: "arquivado", title: "Arquivados" },
];

export default async function InstagramInboxPage() {
  const { supabase } = await requireUser();
  const { data: cards } = await supabase
    .from("instagram_inbox_cards")
    .select(
      "id, instagram_sender_id, sender_username, sender_name, message_text, status, received_at, handled_at",
    )
    .order("received_at", { ascending: false })
    .returns<InstagramCard[]>();

  const items = cards ?? [];
  const activeItems = items.filter((card) => card.status !== "arquivado");

  return (
    <main>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Entradas do Instagram</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Mensagens recebidas no Direct viram cards aqui para o comercial
              nao perder nenhuma oportunidade. O contato continua sendo feito
              pelo proprio Instagram.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037]"
            href="https://www.instagram.com/direct/inbox/"
          >
            Abrir Direct
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Cards ativos" value={String(activeItems.length)} />
          <MetricCard
            label="Novos"
            value={String(items.filter((card) => card.status === "novo").length)}
          />
          <MetricCard
            label="Em atendimento"
            value={String(
              items.filter((card) => card.status === "em_atendimento").length,
            )}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const columnItems = items.filter((card) => card.status === column.status);

            return (
              <section
                className="flex min-h-[28rem] flex-col rounded-lg border border-[#dfd7cc] bg-white"
                key={column.status}
              >
                <div className="flex items-center justify-between border-b border-[#dfd7cc] px-4 py-4">
                  <h2 className="font-semibold">{column.title}</h2>
                  <span className={countClassName(column.status)}>
                    {columnItems.length}
                  </span>
                </div>

                {columnItems.length ? (
                  <div className="flex flex-1 flex-col gap-3 bg-[#f8f6ee] p-3">
                    {columnItems.map((card) => (
                      <InstagramCard key={card.id} card={card} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center bg-[#f8f6ee] px-5 py-8 text-center text-sm text-[#5d5248]">
                    Nenhum card nesta etapa.
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#dfd7cc] bg-white p-5">
      <p className="text-sm text-[#5d5248]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function InstagramCard({ card }: { card: InstagramCard }) {
  const senderLabel =
    card.sender_username ?? card.sender_name ?? `Instagram ID ${card.instagram_sender_id}`;

  return (
    <article className={cardClassName(card.status)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={badgeClassName(card.status)}>{statusLabels[card.status]}</span>
          <h3 className="mt-2 font-semibold leading-5">{senderLabel}</h3>
          <p className="mt-1 text-xs text-[#5d5248]">
            {new Date(card.received_at).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-5">{card.message_text}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="inline-flex h-8 items-center rounded-lg border border-[#dfd7cc] bg-white px-3 text-xs font-medium transition hover:bg-[#f5f3e7]"
          href="https://www.instagram.com/direct/inbox/"
        >
          Abrir Direct
        </Link>
        {statusActions
          .filter((action) => action.status !== card.status)
          .map((action) => (
            <StatusButton
              id={card.id}
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
  status: InstagramCardStatus;
  title: string;
}) {
  return (
    <form action={updateInstagramCardStatus}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />
      <button
        className="inline-flex h-8 items-center rounded-lg border border-[#dfd7cc] bg-white px-3 text-xs font-medium transition hover:bg-[#f5f3e7]"
        type="submit"
      >
        {title}
      </button>
    </form>
  );
}

function cardClassName(status: InstagramCardStatus) {
  const base = "rounded-lg border p-4 shadow-sm";

  if (status === "novo") {
    return `${base} border-pink-300 bg-pink-50`;
  }

  if (status === "em_atendimento") {
    return `${base} border-sky-300 bg-sky-50`;
  }

  if (status === "concluido") {
    return `${base} border-emerald-300 bg-emerald-50`;
  }

  return `${base} border-[#dfd7cc] bg-white`;
}

function badgeClassName(status: InstagramCardStatus) {
  const base = "rounded-full px-3 py-1 text-xs font-medium";

  if (status === "novo") {
    return `${base} bg-pink-200 text-pink-900`;
  }

  if (status === "em_atendimento") {
    return `${base} bg-sky-200 text-sky-900`;
  }

  if (status === "concluido") {
    return `${base} bg-emerald-200 text-emerald-900`;
  }

  return `${base} bg-[#dfd7cc] text-[#333333]`;
}

function countClassName(status: InstagramCardStatus) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold";

  if (status === "novo") {
    return `${base} bg-pink-100 text-pink-800`;
  }

  if (status === "em_atendimento") {
    return `${base} bg-sky-100 text-sky-800`;
  }

  if (status === "concluido") {
    return `${base} bg-emerald-100 text-emerald-800`;
  }

  return `${base} bg-[#dfd7cc] text-[#333333]`;
}

const statusActions: Array<{ status: InstagramCardStatus; title: string }> = [
  { status: "novo", title: "Reabrir" },
  { status: "em_atendimento", title: "Atender" },
  { status: "concluido", title: "Concluir" },
  { status: "arquivado", title: "Arquivar" },
];
