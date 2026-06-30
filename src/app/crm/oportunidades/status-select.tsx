"use client";

import { useState, useTransition } from "react";
import { updateOpportunityStatus } from "./actions";

type OpportunityStatus =
  | "aberta"
  | "proposta_enviada"
  | "aguardando_retorno"
  | "fechada"
  | "perdida";

const statusOptions: Array<{ status: OpportunityStatus; title: string }> = [
  { status: "aberta", title: "Aberta" },
  { status: "proposta_enviada", title: "Proposta enviada" },
  { status: "aguardando_retorno", title: "Aguardando retorno" },
  { status: "fechada", title: "Fechada" },
  { status: "perdida", title: "Perdida" },
];

export function OpportunityStatusSelect({
  id,
  proposedValue,
  status,
}: {
  id: string;
  proposedValue: number | null;
  status: OpportunityStatus;
}) {
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [pendingFinalStatus, setPendingFinalStatus] = useState<OpportunityStatus | null>(
    null,
  );
  const [closedValue, setClosedValue] = useState(formatDecimalInput(proposedValue));
  const [isPending, startTransition] = useTransition();

  function submitStatus(nextStatus: OpportunityStatus, value?: string) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", nextStatus);

    if (value) {
      formData.set("closed_value", value);
    }

    startTransition(async () => {
      await updateOpportunityStatus(formData);
      setSelectedStatus(nextStatus);
      setPendingFinalStatus(null);
    });
  }

  function handleStatusChange(value: string) {
    const nextStatus = value as OpportunityStatus;

    if (nextStatus === "fechada" || nextStatus === "perdida") {
      setPendingFinalStatus(nextStatus);
      return;
    }

    submitStatus(nextStatus);
  }

  function closeModal() {
    setPendingFinalStatus(null);
    setSelectedStatus(status);
  }

  return (
    <>
      <label className="flex flex-col gap-1 text-xs font-medium text-[#5d5248]">
        Etapa
        <select
          className="h-8 rounded-md border border-[#dfd7cc] bg-white px-2 text-xs font-semibold text-[#333333] outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          disabled={isPending}
          onChange={(event) => handleStatusChange(event.target.value)}
          value={selectedStatus}
        >
          {statusOptions.map((option) => (
            <option key={option.status} value={option.status}>
              {option.title}
            </option>
          ))}
        </select>
      </label>

      {pendingFinalStatus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#333333]/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-[#fffdf8] shadow-2xl">
            <div className={modalHeaderClassName(pendingFinalStatus)}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                {pendingFinalStatus === "fechada" ? "Venda fechada" : "Proposta perdida"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {pendingFinalStatus === "fechada"
                  ? "Confirme o valor final"
                  : "Confirme o encerramento"}
              </h2>
              <p className="mt-2 text-sm leading-6">
                {pendingFinalStatus === "fechada"
                  ? "Antes de finalizar, aprove o orçamento no sistema e informe o valor real fechado."
                  : "Antes de marcar como perdida, confira se o orçamento foi atualizado ou encerrado no sistema."}
              </p>
            </div>

            <form
              className="grid gap-4 p-5"
              onSubmit={(event) => {
                event.preventDefault();
                submitStatus(
                  pendingFinalStatus,
                  pendingFinalStatus === "fechada" ? closedValue : undefined,
                );
              }}
            >
              {pendingFinalStatus === "fechada" ? (
                <label className="grid gap-2 text-sm font-medium">
                  Valor fechado
                  <input
                    className="h-11 rounded-lg border border-[#ead8c8] bg-white px-3 text-base outline-none transition focus:border-[#c96f61] focus:ring-2 focus:ring-[#f1c9bf]"
                    inputMode="decimal"
                    onChange={(event) => setClosedValue(event.target.value)}
                    placeholder="1500,00"
                    required
                    value={closedValue}
                  />
                </label>
              ) : null}

              <label className="flex gap-3 rounded-lg border border-[#ead8c8] bg-[#fff8f2] p-3 text-sm leading-6">
                <input className="mt-1 size-4 accent-[#c96f61]" required type="checkbox" />
                <span>
                  {pendingFinalStatus === "fechada"
                    ? "Confirmo que o orçamento foi aprovado no sistema."
                    : "Confirmo que revisei o orçamento no sistema antes de perder a proposta."}
                </span>
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="h-10 rounded-lg border border-[#ead8c8] px-4 text-sm font-medium transition hover:bg-[#fff0ea]"
                  disabled={isPending}
                  onClick={closeModal}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={modalButtonClassName(pendingFinalStatus)}
                  disabled={isPending}
                  type="submit"
                >
                  {isPending
                    ? "Salvando..."
                    : pendingFinalStatus === "fechada"
                      ? "Fechar venda"
                      : "Marcar como perdida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatDecimalInput(value: number | null) {
  if (value === null) {
    return "";
  }

  return Number(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function modalHeaderClassName(status: OpportunityStatus) {
  const base = "p-5 text-[#333333]";

  if (status === "fechada") {
    return `${base} bg-[linear-gradient(135deg,#eef6e9_0%,#b8dcc8_100%)]`;
  }

  return `${base} bg-[linear-gradient(135deg,#fff0ea_0%,#f1b7ad_100%)]`;
}

function modalButtonClassName(status: OpportunityStatus) {
  const base =
    "h-10 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70";

  if (status === "fechada") {
    return `${base} bg-emerald-700 hover:bg-emerald-800`;
  }

  return `${base} bg-[#c96f61] hover:bg-[#b85f52]`;
}
