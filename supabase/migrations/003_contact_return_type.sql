alter table public.contact_logs
add column if not exists return_type text not null default 'comercial';
