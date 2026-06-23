"use client";

import { useActionState, useState } from "react";
import {
  createQuickContact,
  createQuickOpportunity,
  createQuickPatient,
  type QuickActionState,
} from "./actions";

type PatientOption = {
  id: string;
  name: string;
  phone: string;
};

const initialState: QuickActionState = {};

export function QuickForms({ patients }: { patients: PatientOption[] }) {
  const [phone, setPhone] = useState("");
  const [patientState, patientAction, isPatientPending] = useActionState(
    createQuickPatient,
    initialState,
  );
  const [contactState, contactAction, isContactPending] = useActionState(
    createQuickContact,
    initialState,
  );
  const [opportunityState, opportunityAction, isOpportunityPending] = useActionState(
    createQuickOpportunity,
    initialState,
  );

  return (
    <div className="grid gap-5">
      <form action={patientAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold">Cadastrar paciente rapido</h2>
          <p className="mt-1 text-sm text-[#5d5248]">
            Use quando o paciente ainda nao existir no CRM.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium lg:col-span-1">
            Nome
            <input className={fieldClassName} name="name" required />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium lg:col-span-1">
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

          <label className="flex flex-col gap-2 text-sm font-medium">
            Origem
            <input className={fieldClassName} name="lead_source" placeholder="Instagram, WhatsApp..." />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Interesse
            <input className={fieldClassName} name="main_interest" placeholder="Rugas, papada, emagrecimento..." />
          </label>
        </div>

        {patientState.message ? <FormError message={patientState.message} /> : null}

        <button className={buttonClassName} disabled={isPatientPending} type="submit">
          {isPatientPending ? "Cadastrando..." : "Cadastrar paciente"}
        </button>
      </form>

      {patients.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
      <form action={contactAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold">Registrar contato</h2>
          <p className="mt-1 text-sm text-[#5d5248]">
            Para ligações, WhatsApp, Instagram ou retorno combinado.
          </p>
        </div>

        <PatientSelect patients={patients} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Canal
            <select className={fieldClassName} name="channel" required defaultValue="">
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
            Proximo contato
            <input className={fieldClassName} name="next_contact_at" type="datetime-local" />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          O que foi conversado
          <textarea
            className={`${fieldClassName} min-h-28 py-3`}
            name="summary"
            placeholder="Resumo da conversa, interesse, orientacoes e combinados..."
            required
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Objecao
            <input className={fieldClassName} name="patient_objection" />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Proxima acao
            <input className={fieldClassName} name="next_action" />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-[#dfd7cc] bg-[#f5f3e7] px-4 py-3 text-sm font-medium">
          <input className="size-4 accent-[#9e7f60]" name="waiting_patient_response" type="checkbox" />
          Aguardando retorno do paciente
        </label>

        {contactState.message ? <FormError message={contactState.message} /> : null}

        <button className={buttonClassName} disabled={isContactPending} type="submit">
          {isContactPending ? "Salvando..." : "Salvar contato"}
        </button>
      </form>

      <form action={opportunityAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold">Registrar oportunidade</h2>
          <p className="mt-1 text-sm text-[#5d5248]">
            Para proposta, procedimento sugerido e valor em aberto.
          </p>
        </div>

        <PatientSelect patients={patients} />

        <label className="flex flex-col gap-2 text-sm font-medium">
          Procedimento sugerido
          <input
            className={fieldClassName}
            name="suggested_procedure"
            placeholder="Ex.: bioestimulador, harmonizacao, emagrecimento..."
            required
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Valor
            <input className={fieldClassName} inputMode="decimal" name="proposed_value" placeholder="1500,00" />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Status
            <select className={fieldClassName} defaultValue="aberta" name="status">
              <option value="aberta">Aberta</option>
              <option value="proposta_enviada">Proposta enviada</option>
              <option value="aguardando_retorno">Aguardando retorno</option>
              <option value="fechada">Fechada</option>
              <option value="perdida">Perdida</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Retorno previsto
          <input className={fieldClassName} name="expected_return_at" type="datetime-local" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Observacoes da proposta
          <textarea
            className={`${fieldClassName} min-h-28 py-3`}
            name="notes"
            placeholder="Condições, expectativa do paciente, combinados e estrategia..."
          />
        </label>

        {opportunityState.message ? (
          <FormError message={opportunityState.message} />
        ) : null}

        <button className={buttonClassName} disabled={isOpportunityPending} type="submit">
          {isOpportunityPending ? "Salvando..." : "Salvar oportunidade"}
        </button>
      </form>
        </div>
      ) : (
        <div className="rounded-lg border border-[#dfd7cc] bg-white px-5 py-8 text-center text-sm text-[#5d5248]">
          Cadastre o primeiro paciente acima para liberar os registros de contato
          e oportunidade.
        </div>
      )}
    </div>
  );
}

function PatientSelect({ patients }: { patients: PatientOption[] }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      Paciente
      <select className={fieldClassName} name="patient_id" required defaultValue="">
        <option disabled value="">
          Selecione o paciente
        </option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.name} - {patient.phone}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}

const fieldClassName =
  "h-11 rounded-lg border border-[#dfd7cc] bg-white px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]";

const buttonClassName =
  "h-11 rounded-lg bg-[#333333] px-5 font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037] disabled:cursor-not-allowed disabled:opacity-70 md:w-fit";

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
