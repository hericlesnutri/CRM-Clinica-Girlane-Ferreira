alter table public.opportunities
add column if not exists closed_at timestamptz,
add column if not exists lost_at timestamptz;

update public.opportunities
set closed_at = coalesce(closed_at, updated_at)
where status = 'fechada'
  and closed_at is null;

update public.opportunities
set lost_at = coalesce(lost_at, updated_at)
where status = 'perdida'
  and lost_at is null;
