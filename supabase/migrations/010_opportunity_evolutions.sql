create table if not exists public.opportunity_evolutions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_by uuid references public.profiles(id),
  kind text not null default 'evolucao',
  note text not null,
  next_return_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists opportunity_evolutions_opportunity_created_idx
  on public.opportunity_evolutions(opportunity_id, created_at);

alter table public.opportunity_evolutions enable row level security;

create policy "authenticated users can manage opportunity evolutions"
  on public.opportunity_evolutions for all
  to authenticated
  using (true)
  with check (true);
