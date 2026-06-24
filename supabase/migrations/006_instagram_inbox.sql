create table if not exists public.instagram_inbox_cards (
  id uuid primary key default gen_random_uuid(),
  instagram_sender_id text not null,
  instagram_message_id text unique,
  sender_username text,
  sender_name text,
  message_text text not null,
  status text not null default 'novo',
  raw_payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  handled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists instagram_inbox_cards_status_idx
  on public.instagram_inbox_cards(status);

create index if not exists instagram_inbox_cards_received_at_idx
  on public.instagram_inbox_cards(received_at desc);

create trigger set_instagram_inbox_cards_updated_at
  before update on public.instagram_inbox_cards
  for each row execute function public.set_updated_at();

alter table public.instagram_inbox_cards enable row level security;

create policy "authenticated users can read instagram inbox"
  on public.instagram_inbox_cards for select
  to authenticated
  using (true);

create policy "authenticated users can update instagram inbox"
  on public.instagram_inbox_cards for update
  to authenticated
  using (true)
  with check (true);
