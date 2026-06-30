"use client";

import { useActionState, useState } from "react";
import {
  createCommercialRecord,
  createQuickPatient,
  type QuickActionState,
} from "./actions";

type PatientOption = {
  id: string;
  name: string;
  phone: string;
};

type RecordType = "oportunidade" | "pos_procedimento";

const initialState: QuickActionState = {};

export function QuickForms({ patients }: { patients: PatientOption[] }) {
  const [phone, setPhone] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("oportunidade");
  const [patientState, patientAction, isPatientPending] = useActionState(
    createQuickPatient,
    initialState,
  );
  const [commercialState, commercialAction, isCommercialPending] = useActionState(
    createCommercialRecord,
    initialState,
  );

  return (
    <div className="grid gap-5">
      <form action={patientAction} className="grid gap-4 rounded-lg border border-[#dfd7cc] bg-white p-4 lg:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60]">
              Novo paciente
            </p>
            <h2 className="mt-1 text-xl font-semibold">Cadastrar paciente</h2>
          </div>
          <p className="mt-1 text-sm text-[#5d5248]">
            Use apenas se ele ainda nao aparece na busca abaixo.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nome
            <input className={fieldClassName} name="name" required />
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
        <form action={commercialAction} className={commercialFormClassName(recordType)}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60]">
                Atendimento
              </p>
              <h2 className="mt-1 text-xl font-semibold">Registrar no CRM</h2>
            </div>
            <p className="mt-1 text-sm text-[#5d5248]">
              Escolha uma opcao. O formulario muda sozinho.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TypeButton
              active={recordType === "oportunidade"}
              description="Lead, agendamento, proposta, valor ou negociacao."
              label="Oportunidade / Venda"
              onClick={() => setRecordType("oportunidade")}
            />
            <TypeButton
              active={recordType === "pos_procedimento"}
              description="Acompanhamento depois de um procedimento realizado."
              label="Pos-venda / Acompanhamento"
              onClick={() => setRecordType("pos_procedimento")}
            />
          </div>

          <input name="record_type" type="hidden" value={recordType} />
          <PatientSelect patients={patients} />

          {recordType === "oportunidade" ? <OpportunityFields /> : null}
          {recordType === "pos_procedimento" ? <PostProcedureFields /> : null}

          {commercialState.message ? <FormError message={commercialState.message} /> : null}

          <button className={buttonClassName} disabled={isCommercialPending} type="submit">
            {isCommercialPending ? "Salvando..." : submitLabelByType[recordType]}
          </button>
        </form>
      ) : (
        <div className="rounded-lg border border-[#dfd7cc] bg-white px-5 py-8 text-center text-sm text-[#5d5248]">
          Cadastre o primeiro paciente acima para liberar os registros comerciais.
        </div>
      )}
    </div>
  );
}

function OpportunityFields() {
  return (
    <>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Procedimento sugerido
        <input
          className={fieldClassName}
          name="suggested_procedure"
          placeholder="Ex.: bioestimulador, harmonizacao, emagrecimento..."
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
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

        <label className="flex flex-col gap-2 text-sm font-medium">
          Retorno previsto
          <input className={fieldClassName} name="expected_return_at" type="datetime-local" />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Observacoes da proposta
        <textarea
          className={`${fieldClassName} min-h-28 py-3`}
          name="notes"
          placeholder="Condicoes, expectativa do paciente, combinados e estrategia..."
        />
      </label>
    </>
  );
}

function PostProcedureFields() {
  return (
    <>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Procedimento realizado
        <input
          className={fieldClassName}
          name="procedure_name"
          placeholder="Ex.: bioestimulador, preenchimento labial..."
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Data do procedimento
          <input className={fieldClassName} name="performed_at" type="date" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Primeiro acompanhamento
          <input className={fieldClassName} name="next_contact_at" required type="date" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Dias seguidos
          <input
            className={fieldClassName}
            defaultValue={3}
            max={10}
            min={1}
            name="follow_up_days"
            required
            type="number"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Observacoes do acompanhamento
        <textarea
          className={`${fieldClassName} min-h-28 py-3`}
          name="notes"
          placeholder="Orientacoes passadas, ponto de atencao, sensibilidade relatada..."
        />
      </label>
    </>
  );
}

function PatientSelect({ patients }: { patients: PatientOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [search, setSearch] = useState("");
  const filteredPatients = filterPatients(patients, search).slice(0, 8);

  const selectedPatient = patients.find((patient) => patient.id === patientId);

  function handleSearchChange(value: string) {
    setSearch(value);
    setIsOpen(true);

    if (selectedPatient && value !== getPatientLabel(selectedPatient)) {
      setPatientId("");
    }
  }

  function handlePatientSelect(patient: PatientOption) {
    setPatientId(patient.id);
    setSearch(getPatientLabel(patient));
    setIsOpen(false);
  }

  return (
    <label className="relative flex flex-col gap-2 text-sm font-medium">
      Paciente
      <input name="patient_id" required type="hidden" value={patientId} />
      <input
        autoComplete="off"
        className={fieldClassName}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onChange={(event) => handleSearchChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="Digite o nome ou telefone do paciente"
        required
        value={search}
      />

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[4.6rem] z-20 overflow-hidden rounded-lg border border-[#dfd7cc] bg-white shadow-lg">
          {filteredPatients.length ? (
            filteredPatients.map((patient) => (
              <button
                className="flex w-full flex-col gap-1 border-b border-[#eee8df] px-3 py-3 text-left last:border-b-0 hover:bg-[#f5f3e7]"
                key={patient.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePatientSelect(patient)}
                type="button"
              >
                <span className="font-semibold">{patient.name}</span>
                <span className="text-xs text-[#5d5248]">{patient.phone}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-[#5d5248]">
              Nenhum paciente encontrado.
            </p>
          )}
        </div>
      ) : null}

      {!patientId && search ? (
        <span className="text-xs font-normal text-[#8a6b4c]">
          Selecione um paciente da lista para continuar.
        </span>
      ) : null}
    </label>
  );
}

function TypeButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-lg border p-3 text-left transition ${
        active
          ? "border-[#333333] bg-[#333333] text-[#f5f3e7]"
          : "border-[#dfd7cc] bg-white hover:bg-[#f5f3e7]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="font-semibold">{label}</span>
      <span className={`mt-1 block text-xs leading-5 ${active ? "text-[#dfd7cc]" : "text-[#5d5248]"}`}>
        {description}
      </span>
    </button>
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

const submitLabelByType: Record<RecordType, string> = {
  oportunidade: "Salvar oportunidade / venda",
  pos_procedimento: "Criar acompanhamento pos-venda",
};

function commercialFormClassName(recordType: RecordType) {
  const base = "grid gap-4 rounded-lg border p-4 lg:p-5";

  if (recordType === "oportunidade") {
    return `${base} border-amber-300 bg-amber-50`;
  }

  if (recordType === "pos_procedimento") {
    return `${base} border-emerald-300 bg-emerald-50`;
  }

  return `${base} border-[#dfd7cc] bg-white`;
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

function filterPatients(patients: PatientOption[], search: string) {
  const normalizedSearch = normalizeSearch(search);

  if (!normalizedSearch) {
    return patients;
  }

  return patients.filter((patient) => {
    return normalizeSearch(`${patient.name} ${patient.phone}`).includes(normalizedSearch);
  });
}

function getPatientLabel(patient: PatientOption) {
  return `${patient.name} - ${patient.phone}`;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
