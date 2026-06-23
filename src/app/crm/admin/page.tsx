import Link from "next/link";
import { redirect } from "next/navigation";
import { updateTeamMember } from "./actions";
import { requireUser } from "@/lib/auth/require-user";

type AppRole = "admin" | "recepcionista" | "comercial";

type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  role: AppRole;
  created_at: string;
};

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  recepcionista: "Recepcionista",
  comercial: "Comercial",
};

export default async function AdminPage() {
  const { supabase, user } = await requireUser();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: AppRole }>();

  if (currentProfile?.role !== "admin") {
    redirect("/crm");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: true })
    .returns<Profile[]>();

  const team = profiles ?? [];

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Administracao da equipe</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Ajuste nome e permissao dos usuarios cadastrados no Supabase Auth.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dfd7cc] bg-white px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
            href="https://supabase.com/dashboard/project/nsygjrhypfzxllkfblzr/auth/users"
          >
            Abrir usuarios no Supabase
          </Link>
        </div>

        <div className="rounded-lg border border-[#dfd7cc] bg-white">
          <div className="border-b border-[#dfd7cc] px-5 py-4">
            <h2 className="font-semibold">Usuarios do CRM</h2>
            <p className="mt-1 text-sm text-[#5d5248]">
              Crie o usuario no Supabase Auth e depois ajuste o perfil por aqui.
            </p>
          </div>

          {team.length ? (
            <div className="divide-y divide-[#dfd7cc]">
              {team.map((profile) => (
                <TeamMemberForm
                  isCurrentUser={profile.id === user.id}
                  key={profile.id}
                  profile={profile}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[#5d5248]">
              Nenhum usuario encontrado.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function TeamMemberForm({
  isCurrentUser,
  profile,
}: {
  isCurrentUser: boolean;
  profile: Profile;
}) {
  return (
    <form action={updateTeamMember} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.4fr_1fr_13rem_auto] lg:items-end">
      <input name="id" type="hidden" value={profile.id} />

      <label className="flex flex-col gap-2 text-sm font-medium">
        Nome
        <input
          className={fieldClassName}
          defaultValue={profile.full_name}
          name="full_name"
          required
        />
      </label>

      <div>
        <p className="text-sm font-medium">Email</p>
        <p className="mt-3 break-all text-sm text-[#5d5248]">
          {profile.email ?? "Sem email"}
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Perfil
        <select className={fieldClassName} defaultValue={profile.role} name="role">
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        {isCurrentUser ? (
          <span className="text-xs font-medium text-[#9e7f60]">Seu usuario</span>
        ) : null}
        <button
          className="h-10 rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037]"
          type="submit"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

const fieldClassName =
  "h-11 rounded-lg border border-[#dfd7cc] bg-white px-3 outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]";
