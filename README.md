# CRM Girlane Ferreira

Software online para o comercial da Clinica Girlane Ferreira, preparado para rodar com GitHub, Vercel e Supabase no plano gratuito.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Supabase Auth e Postgres
- Deploy pela Vercel

## Ambiente local

Instale as dependencias:

```bash
npm install
```

Crie um arquivo `.env.local` baseado em `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Rode o projeto:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Supabase

1. Crie um projeto no Supabase.
2. Copie `Project URL` para `NEXT_PUBLIC_SUPABASE_URL`.
3. Copie `anon public` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. No SQL Editor do Supabase, execute `supabase/migrations/001_initial_crm_schema.sql`.
5. Em Authentication, configure o login por e-mail.

## Vercel

1. Envie este repositorio para o GitHub.
2. Importe o repositorio na Vercel.
3. Cadastre as mesmas variaveis de ambiente do `.env.local`.
4. Use o comando de build padrao: `npm run build`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
