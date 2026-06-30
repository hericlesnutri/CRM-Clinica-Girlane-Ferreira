alter table public.opportunities
add column if not exists closed_value numeric(10,2);
