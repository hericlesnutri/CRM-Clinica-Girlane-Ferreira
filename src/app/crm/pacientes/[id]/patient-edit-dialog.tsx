"use client";

import { useActionState, useState } from "react";
import { updatePatient, type PatientEditFormState } from "./actions";

type EditablePatient = {
  id: string;
  name: string;
  phone: string;
  lead_source: string | null;
  main_interest: string | null;
  notes: string | null;
};

const initialState: PatientEditFormState = {};

export function PatientEditDialog({ patient }: { patient: EditablePatient }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState(patient.phone);
  const [state, formAction, isPending] = useActionState(
    updatePatient.bind(null, patient.id),
    initialState,
  );

  return (
    <>
      <button
        className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dfd7cc] px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Editar paciente
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Editar paciente</h2>
                <p className="mt-1 text-sm leading-6 text-[#5d5248]">
                  Atualize dados comerciais, telefone e observacoes da ficha.
                </p>
              </div>
              <button
                className="rounded-lg border border-[#dfd7cc] px-3 py-1 text-sm"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Fechar
              </button>
            </div>

            <form action={formAction} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Nome
                  <input
                    className={fieldClassName}
                    defaultValue={patient.name}
                    name="name"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  Telefone / WhatsApp
                  <input
                    className={fieldClassName}
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
                    className={fieldClassName}
                    defaultValue={patient.lead_source ?? ""}
                    name="lead_source"
                    placeholder="Instagram, indicacao, WhatsApp..."
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  Interesse principal
                  <input
                    className={fieldClassName}
                    defaultValue={patient.main_interest ?? ""}
                    name="main_interest"
                    placeholder="Rejuvenescimento, papada, emagrecimento..."
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium">
                Observacoes
                <textarea
                  className="min-h-28 rounded-lg border border-[#dfd7cc] px-3 py-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
                  defaultValue={patient.notes ?? ""}
                  name="notes"
                  placeholder="Contexto comercial, expectativas, pontos importantes da conversa..."
                />
              </label>

              {state.message ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.message}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  className="h-10 rounded-lg border border-[#dfd7cc] px-4 text-sm font-medium transition hover:bg-[#f5f3e7]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="h-10 rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

const fieldClassName =
  "h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]";

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
