"use client";

import { useActionState, useState } from "react";
import { createPatient, type PatientFormState } from "./actions";

const initialState: PatientFormState = {};

export function PatientForm() {
  const [state, formAction, isPending] = useActionState(createPatient, initialState);
  const [phone, setPhone] = useState("");

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome do paciente
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="name"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Telefone / WhatsApp
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            inputMode="tel"
            maxLength={21}
            name="phone"
            onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
            pattern="\+55 \([0-9]{2}\) 9 [0-9]{4}-[0-9]{4}"
            placeholder="+55 (47) 9 9999-9999"
            required
            title="Use o formato +55 (47) 9 9999-9999"
            value={phone}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Origem
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="lead_source"
            placeholder="Instagram, indicacao, WhatsApp..."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Interesse principal
          <input
            className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
            name="main_interest"
            placeholder="Rejuvenescimento, papada, emagrecimento..."
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Observacoes
        <textarea
          className="min-h-24 rounded-lg border border-[#dfd7cc] px-3 py-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          name="notes"
          placeholder="Contexto comercial, expectativas, pontos importantes da conversa..."
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
        {isPending ? "Cadastrando..." : "Cadastrar paciente"}
      </button>
    </form>
  );
}

function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);
  const ddd = digits.slice(0, 2);
  const ninthDigit = digits.slice(2, 3);
  const firstPart = digits.slice(3, 7);
  const secondPart = digits.slice(7, 11);

  let formatted = "+55";

  if (ddd) {
    formatted += ` (${ddd}`;
  }

  if (ddd.length === 2) {
    formatted += ")";
  }

  if (ninthDigit) {
    formatted += ` ${ninthDigit}`;
  }

  if (firstPart) {
    formatted += ` ${firstPart}`;
  }

  if (secondPart) {
    formatted += `-${secondPart}`;
  }

  return formatted;
}
