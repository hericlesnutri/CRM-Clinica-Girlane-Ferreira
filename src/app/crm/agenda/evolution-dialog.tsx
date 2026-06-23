"use client";

import { useState, useTransition } from "react";
import { registerAgendaEvolution } from "./actions";

export function EvolutionDialog({
  itemId,
  itemType,
}: {
  itemId: string;
  itemType: "contact" | "opportunity";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[#333333] px-3 text-xs font-medium text-[#f5f3e7] transition hover:bg-[#4a4037]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Registrar evolucao
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Registrar evolucao</h2>
                <p className="mt-1 text-sm leading-6 text-[#5d5248]">
                  Descreva o contato realizado. Informe uma nova data somente se
                  precisar continuar o acompanhamento.
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

            <form
              action={(formData) => {
                startTransition(async () => {
                  await registerAgendaEvolution(formData);
                  setIsOpen(false);
                });
              }}
              className="mt-5 grid gap-4"
            >
              <input name="id" type="hidden" value={itemId} />
              <input name="type" type="hidden" value={itemType} />

              <label className="flex flex-col gap-2 text-sm font-medium">
                Registro do contato realizado
                <textarea
                  className="min-h-28 rounded-lg border border-[#dfd7cc] px-3 py-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
                  name="evolution_note"
                  placeholder="Ex.: paciente relatou boa recuperacao, sem intercorrencias..."
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                Nova data de retorno opcional
                <input
                  className="h-11 rounded-lg border border-[#dfd7cc] px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
                  name="next_return_at"
                  type="datetime-local"
                />
                <span className="text-xs leading-5 text-[#5d5248]">
                  Deixe em branco para encerrar este retorno sem novo contato.
                </span>
              </label>

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
                  {isPending ? "Salvando..." : "Salvar evolucao"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
