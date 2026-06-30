"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Patient = {
  id: string;
  name: string;
  phone: string;
  lead_source: string | null;
  main_interest: string | null;
  notes: string | null;
  created_at: string;
};

export function PatientsList({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("");
  const filteredPatients = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    if (!normalizedSearch) {
      return patients;
    }

    return patients.filter((patient) => {
      return normalizeSearch(`${patient.name} ${patient.phone}`).includes(
        normalizedSearch,
      );
    });
  }, [patients, search]);

  return (
    <section className="rounded-lg border border-[#ead8c8] bg-[#fffdf8] shadow-sm">
      <div className="grid gap-4 border-b border-[#ead8c8] bg-[#fff0ea]/60 px-5 py-4 md:grid-cols-[1fr_20rem] md:items-center">
        <div>
          <h2 className="font-semibold">Pacientes cadastrados</h2>
          <p className="mt-1 text-sm text-[#5d5248]">
            {filteredPatients.length} de {patients.length} pacientes
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Buscar
          <input
            className="h-11 rounded-lg border border-[#ead8c8] bg-white px-3 outline-none transition focus:border-[#c96f61] focus:ring-2 focus:ring-[#f1c9bf]"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou telefone"
            value={search}
          />
        </label>
      </div>

      {filteredPatients.length ? (
        <div className="divide-y divide-[#f1e1d4]">
          {filteredPatients.map((patient) => (
            <article key={patient.id} className="grid gap-3 px-5 py-4 transition hover:bg-[#fff8f2] md:grid-cols-[1.2fr_1fr_1fr]">
              <div>
                <Link
                  className="font-semibold transition hover:text-[#9e7f60]"
                  href={`/crm/pacientes/${patient.id}`}
                >
                  {patient.name}
                </Link>
                <p className="mt-1 text-sm text-[#5d5248]">{patient.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9e7f60]">
                  Interesse
                </p>
                <p className="mt-1 text-sm">{patient.main_interest ?? "Nao informado"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9e7f60]">
                  Origem
                </p>
                <p className="mt-1 text-sm">{patient.lead_source ?? "Nao informada"}</p>
              </div>
              {patient.notes ? (
                <p className="md:col-span-3 text-sm leading-6 text-[#5d5248]">
                  {patient.notes}
                </p>
              ) : null}
              <div className="md:col-span-3">
                <Link
                  className="inline-flex h-9 items-center rounded-lg border border-[#dfd7cc] px-3 text-sm font-medium transition hover:bg-[#f5f3e7]"
                  href={`/crm/pacientes/${patient.id}`}
                >
                  Abrir ficha
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-[#5d5248]">
          Nenhum paciente encontrado.
        </div>
      )}
    </section>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
