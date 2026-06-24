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
SUPABASE_SERVICE_ROLE_KEY=
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=
INSTAGRAM_APP_SECRET=
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
4. No SQL Editor do Supabase, execute as migrations da pasta `supabase/migrations` em ordem.
5. Em Authentication, configure o login por e-mail.

## Criar usuarios

No Supabase, acesse `Authentication` > `Users` > `Add user`.

Depois de criar o usuario, ajuste o perfil na tabela `profiles`:

- `role = admin` para administrador
- `role = recepcionista` para recepcao
- `role = comercial` para equipe comercial

O CRM usa a rota `/login` para entrada e `/crm` para o painel protegido.
Administradores podem acessar `/crm/admin` para ajustar nome e perfil dos
usuarios ja criados no Supabase Auth.
As telas internas do CRM usam um menu compartilhado com atalhos principais,
barra superior no desktop, navegação inferior no mobile e botao de sair.

## Rotas atuais

- `/` pagina inicial
- `/login` acesso da equipe
- `/crm` painel protegido com metricas iniciais
- `/crm/admin` administracao da equipe e perfis de acesso, visivel apenas para admin
- `/crm/atendimento` central comercial com cadastro rapido de paciente, busca por nome/telefone e formulario unico para contato, oportunidade ou acompanhamento pos-procedimento
- `/crm/agenda` agenda de retornos comerciais atrasados, de hoje e proximos
- `/crm/instagram` cards automaticos de mensagens recebidas pelo Direct do Instagram
- `/crm/oportunidades` funil/kanban de oportunidades por status, valor em aberto e acoes comerciais rapidas
- `/crm/pacientes` cadastro e listagem pesquisavel de pacientes
- `/crm/pacientes/[id]` ficha editavel do paciente, ultimo procedimento, oportunidades e historico de contatos
- `/crm/relatorios` indicadores simples de valor em aberto, valor fechado, conversao, contatos e retornos

O funil de oportunidades organiza propostas por etapa: aberta, proposta
enviada, aguardando retorno, fechada e perdida. Os cards mostram paciente,
telefone, procedimento, valor, retorno previsto e permitem registrar evolucao ou
alterar o status rapidamente.

Na agenda, os cards usam cores por funcao: oportunidade, aguardando retorno,
pos-procedimento e contato comercial geral. Cada card pode ser concluido para
sair da fila de retornos, com uma observacao rapida sobre o resultado do contato.

O acompanhamento pos-procedimento cria uma sequencia de lembretes diarios para
acompanhar a recuperacao do paciente nos dias seguintes ao procedimento. A
agenda mostra apenas o proximo lembrete pendente de cada sequencia.

Na ficha do paciente, oportunidades e contatos tambem usam cores por funcao, e
as conclusoes/evolucoes registradas na agenda aparecem destacadas no historico.
Ao registrar uma evolucao na agenda, uma nova data de retorno e opcional: com
data, o card continua o acompanhamento; sem data, o retorno e encerrado.

A ficha do paciente permite editar nome, telefone, origem, interesse principal e
observacoes sem reabrir formulários de contato ou oportunidade.

## Instagram

A integracao inicial com Instagram recebe webhooks da Meta em
`/api/webhooks/instagram` e cria cards em `/crm/instagram`. O contato continua
sendo feito pelo Direct do Instagram.

Para ativar:

1. Execute `supabase/migrations/006_instagram_inbox.sql` no Supabase.
2. Cadastre `SUPABASE_SERVICE_ROLE_KEY` na Vercel usando a service role key do Supabase.
3. Cadastre `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` na Vercel e use o mesmo texto no painel da Meta.
4. Opcional, mas recomendado: cadastre `INSTAGRAM_APP_SECRET` na Vercel para validar a assinatura dos webhooks.
5. Na Meta, configure o callback como `https://SEU_DOMINIO/api/webhooks/instagram`.

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
