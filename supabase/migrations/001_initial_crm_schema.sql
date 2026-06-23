create type public.app_role as enum ('admin', 'recepcionista', 'comercial');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role public.app_role not null default 'comercial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'comercial')
  );
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  lead_source text,
  main_interest text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  default_price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.patient_procedures (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  procedure_id uuid references public.procedures(id),
  procedure_name text not null,
  performed_at date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  procedure_id uuid references public.procedures(id),
  suggested_procedure text not null,
  proposed_value numeric(10,2),
  status text not null default 'aberta',
  expected_return_at timestamptz,
  owner_id uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  contacted_by uuid references public.profiles(id),
  channel text not null,
  return_type text not null default 'comercial',
  follow_up_group_id uuid,
  summary text not null,
  patient_objection text,
  waiting_patient_response boolean not null default false,
  next_action text,
  next_contact_at timestamptz,
  created_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

create trigger set_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.procedures enable row level security;
alter table public.patient_procedures enable row level security;
alter table public.opportunities enable row level security;
alter table public.contact_logs enable row level security;

create policy "authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins can manage profiles"
  on public.profiles for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "authenticated users can manage patients"
  on public.patients for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read procedures"
  on public.procedures for select
  to authenticated
  using (true);

create policy "admins can manage procedures"
  on public.procedures for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "authenticated users can manage patient procedures"
  on public.patient_procedures for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can manage opportunities"
  on public.opportunities for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can manage contact logs"
  on public.contact_logs for all
  to authenticated
  using (true)
  with check (true);
