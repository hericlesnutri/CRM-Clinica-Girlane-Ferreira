"use client";

import { useActionState } from "react";
import { createOpportunity, type OpportunityFormState } from "./actions";

const initialState: OpportunityFormState = {};

export function OpportunityForm({ patientId }: { patientId: string }) {
  const createOpportunityForPatient = createOpportunity.bind(null, patientId);
  const [state, formAction, isPending] = useActionState(
    createOpportunityForPatient,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          Procedimento sugerido
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="suggested_procedure"
            placeholder="Ex.: harmonizacao facial, bioestimulador, emagrecimento..."
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Valor da proposta
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            inputMode="decimal"
            name="proposed_value"
            placeholder="1500,00"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Status
          <select
            className="h-11 rounded-lg border border-[#dfd7cc] bg-white px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            defaultValue="aberta"
            name="status"
          >
            <option value="aberta">Aberta</option>
            <option value="proposta_enviada">Proposta enviada</option>
            <option value="aguardando_retorno">Aguardando retorno</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Retorno previsto
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="expected_return_at"
            type="datetime-local"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Observacoes da proposta
        <textarea
          className="min-h-24 rounded-lg border border-[#dfd7cc] px-3 py-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          name="notes"
          placeholder="Condições, expectativa do paciente, combinados e estrategia para o proximo contato..."
        />
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
        {isPending ? "Registrando..." : "Registrar oportunidade"}
      </button>
    </form>
  );
}
