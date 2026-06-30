"use client";

import { useRef } from "react";
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
  status,
}: {
  id: string;
  status: OpportunityStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={updateOpportunityStatus} ref={formRef}>
      <input name="id" type="hidden" value={id} />
      <label className="flex flex-col gap-1 text-xs font-medium text-[#5d5248]">
        Etapa
        <select
          className="h-8 rounded-md border border-[#dfd7cc] bg-white px-2 text-xs font-semibold text-[#333333] outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          defaultValue={status}
          name="status"
          onChange={() => formRef.current?.requestSubmit()}
        >
          {statusOptions.map((option) => (
            <option key={option.status} value={option.status}>
              {option.title}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
