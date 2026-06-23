"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/auth/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input
          className="h-12 rounded-lg border border-[#dfd7cc] bg-white px-4 text-base outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Senha
        <input
          className="h-12 rounded-lg border border-[#dfd7cc] bg-white px-4 text-base outline-none transition focus:border-[#9e7f60] focus:ring-2 focus:ring-[#dfd7cc]"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {state.message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="h-12 rounded-lg bg-[#333333] px-5 font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Entrando..." : "Entrar no CRM"}
      </button>
    </form>
  );
}
