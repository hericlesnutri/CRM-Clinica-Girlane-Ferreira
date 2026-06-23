alter table public.contact_logs
add column if not exists follow_up_group_id uuid;
