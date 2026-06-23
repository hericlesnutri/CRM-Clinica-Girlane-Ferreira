import { CalendarDays, CheckCircle2, LockKeyhole, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] px-6 py-8 text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-lg border border-[#dfd7cc] bg-white/70 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#9e7f60]">
              Ambiente online preparado
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              CRM Girlane Ferreira
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#5d5248]">
              Base inicial do CRM comercial para acompanhar pacientes, contatos,
              propostas, retornos e oportunidades de venda com clareza e
              atendimento personalizado.
            </p>
          </div>

          <div className="rounded-lg bg-[#333333] px-5 py-4 text-[#f5f3e7]">
            <p className="text-sm text-[#dfd7cc]">Stack</p>
            <p className="mt-1 font-medium">Next.js + Supabase + Vercel</p>
            <Link
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#f5f3e7] px-4 text-sm font-semibold text-[#333333] transition hover:bg-[#dfd7cc]"
              href="/login"
            >
              Entrar no CRM
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <SetupCard
            icon={<LockKeyhole aria-hidden className="size-5" />}
            title="Login por perfil"
            description="Administrador, recepcionista e comercial com permissões separadas no Supabase."
          />
          <SetupCard
            icon={<CalendarDays aria-hidden className="size-5" />}
            title="Calendário comercial"
            description="Estrutura preparada para agenda semanal ou mensal de contatos, retornos e propostas."
          />
          <SetupCard
            icon={<UsersRound aria-hidden className="size-5" />}
            title="Pacientes e oportunidades"
            description="Modelo inicial pensado para histórico de relacionamento e novas vendas."
          />
        </div>

        <section className="rounded-lg border border-[#dfd7cc] bg-white p-6">
          <h2 className="text-xl font-semibold">Checklist do ambiente</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Projeto Next.js criado",
              "TypeScript e ESLint configurados",
              "Dependências Supabase instaladas",
              "Modelo de variáveis de ambiente preparado",
              "Base SQL inicial criada",
              "Pronto para conectar GitHub, Vercel e Supabase",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 aria-hidden className="size-5 text-[#9e7f60]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
      </main>
  );
}

function SetupCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-[#dfd7cc] bg-white p-5">
      <div className="flex size-10 items-center justify-center rounded-lg bg-[#dfd7cc] text-[#333333]">
        {icon}
      </div>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5d5248]">{description}</p>
    </article>
  );
}
