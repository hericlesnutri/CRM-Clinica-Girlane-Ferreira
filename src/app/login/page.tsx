import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/crm");
  }

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] px-6 py-10 text-[var(--brand-dark)]">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#9e7f60]">
            CRM Girlane Ferreira
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Entre para acompanhar contatos, retornos e propostas comerciais.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#5d5248]">
            Um ambiente interno para manter o relacionamento com cada paciente
            organizado, claro e personalizado.
          </p>
        </div>

        <div className="rounded-lg border border-[#dfd7cc] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Acesso da equipe</h2>
          <p className="mt-2 text-sm leading-6 text-[#5d5248]">
            Use o e-mail e senha cadastrados no Supabase Auth.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
