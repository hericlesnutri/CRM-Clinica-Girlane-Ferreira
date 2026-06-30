"use client";

import { useActionState } from "react";
import { createContactLog, type ContactFormState } from "./actions";

const initialState: ContactFormState = {};

export function ContactForm({ patientId }: { patientId: string }) {
  const createContactForPatient = createContactLog.bind(null, patientId);
  const [state, formAction, isPending] = useActionState(
    createContactForPatient,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Canal do contato
          <select
            className="h-11 rounded-lg border border-[#dfd7cc] bg-white px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="channel"
            required
            defaultValue=""
          >
            <option disabled value="">
              Selecione
            </option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Ligacao">Ligacao</option>
            <option value="Instagram">Instagram</option>
            <option value="Presencial">Presencial</option>
            <option value="Outro">Outro</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Tipo de acompanhamento
          <select
            className="h-11 rounded-lg border border-[#dfd7cc] bg-white px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="return_type"
            defaultValue="comercial"
          >
            <option value="comercial">Oportunidade / Venda</option>
            <option value="aguardando_retorno">Oportunidade / Venda</option>
            <option value="pos_procedimento">Pos-venda</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Proximo contato
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="next_contact_at"
            type="datetime-local"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        O que foi conversado
        <textarea
          className="min-h-28 rounded-lg border border-[#dfd7cc] px-3 py-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          name="summary"
          placeholder="Resumo claro da conversa, interesse do paciente e orientacoes passadas..."
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Objecao do paciente
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="patient_objection"
            placeholder="Preco, medo, tempo, precisa conversar..."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Proxima acao
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="next_action"
            placeholder="Enviar proposta, chamar no WhatsApp, ligar..."
          />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-[#dfd7cc] bg-[#f5f3e7] px-4 py-3 text-sm font-medium">
        <input
          className="size-4 accent-[#9e7f60]"
          name="waiting_patient_response"
          type="checkbox"
        />
        Estamos aguardando retorno do paciente
      </label>

      {state.message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="h-11 rounded-lg bg-[#333333] px-5 font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037] disabled:cursor-not-allowed disabled:opacity-70 md:w-fit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Registrando..." : "Registrar acompanhamento"}
      </button>
    </form>
  );
}
