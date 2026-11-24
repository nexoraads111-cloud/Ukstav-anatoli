-- UKSTAV — leads table for contact form + admin panel (GitHub Pages + Supabase)
-- Idempotent: safe to re-run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  description text,
  callback_time text,
  source text not null default 'contact',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'done', 'spam')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

create index if not exists leads_status_idx
  on public.leads (status);

create or replace function public.leads_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row
  execute function public.leads_set_updated_at();

grant usage on schema public to anon, authenticated;
grant insert on table public.leads to anon, authenticated;
grant select, update, delete on table public.leads to authenticated;

alter table public.leads enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'leads'
  loop
    execute format('drop policy if exists %I on public.leads', r.policyname);
  end loop;
end $$;

-- Public site may create leads only (no read of other people's data)
create policy "leads_insert_anon"
  on public.leads for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) >= 2
    and char_length(trim(phone)) >= 9
    and char_length(coalesce(name, '')) <= 120
    and char_length(coalesce(phone, '')) <= 40
    and char_length(coalesce(description, '')) <= 2000
    and char_length(coalesce(callback_time, '')) <= 40
    and coalesce(source, 'contact') in ('contact', 'quick')
    and coalesce(status, 'new') = 'new'
  );

create policy "leads_select_authenticated"
  on public.leads for select
  to authenticated
  using (true);

create policy "leads_update_authenticated"
  on public.leads for update
  to authenticated
  using (true)
  with check (true);

create policy "leads_delete_authenticated"
  on public.leads for delete
  to authenticated
  using (true);

notify pgrst, 'reload schema';
