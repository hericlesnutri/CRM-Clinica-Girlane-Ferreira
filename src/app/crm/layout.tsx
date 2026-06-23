import type { ReactNode } from "react";
import { CrmShell } from "./crm-shell";
import { requireUser } from "@/lib/auth/require-user";

type AppRole = "admin" | "recepcionista" | "comercial";

type Profile = {
  full_name: string;
  role: AppRole;
};

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <CrmShell profile={profile} userEmail={user.email}>
      {children}
    </CrmShell>
  );
}
