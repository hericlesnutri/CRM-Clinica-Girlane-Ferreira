drop policy if exists "users can update their own profile" on public.profiles;

create policy "users can update their own profile name"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.current_user_role()
  );
