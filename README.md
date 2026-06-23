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

## Criar usuarios

No Supabase, acesse `Authentication` > `Users` > `Add user`.

Depois de criar o usuario, ajuste o perfil na tabela `profiles`:

- `role = admin` para administrador
- `role = recepcionista` para recepcao
- `role = comercial` para equipe comercial

O CRM usa a rota `/login` para entrada e `/crm` para o painel protegido.

## Rotas atuais

- `/` pagina inicial
- `/login` acesso da equipe
- `/crm` painel protegido com metricas iniciais
- `/crm/atendimento` central comercial com cadastro rapido de paciente e formulario unico para contato, oportunidade ou acompanhamento pos-procedimento
- `/crm/agenda` agenda de retornos comerciais atrasados, de hoje e proximos
- `/crm/pacientes` cadastro e listagem de pacientes
- `/crm/pacientes/[id]` ficha do paciente, oportunidades e historico de contatos

Na agenda, os cards usam cores por funcao: oportunidade, aguardando retorno,
pos-procedimento e contato comercial geral. Cada card pode ser concluido para
sair da fila de retornos.

O acompanhamento pos-procedimento cria uma sequencia de lembretes diarios para
acompanhar a recuperacao do paciente nos dias seguintes ao procedimento. A
agenda mostra apenas o proximo lembrete pendente de cada sequencia.

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
