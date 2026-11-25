-- UKSTAV — reviews table (moderated testimonials)
-- Idempotent: safe to re-run in Supabase SQL Editor.
-- Use this file if leads + site_images already exist and you only need reviews.
-- Full fresh install: run supabase/setup.sql instead (includes this).

create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating int not null
    check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews
  add column if not exists author_name text;
alter table public.reviews
  add column if not exists rating int;
alter table public.reviews
  add column if not exists body text;
alter table public.reviews
  add column if not exists status text not null default 'pending';
alter table public.reviews
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.reviews drop constraint if exists reviews_rating_check;
exception when undefined_object then null;
end $$;

alter table public.reviews
  drop constraint if exists reviews_rating_check;
alter table public.reviews
  add constraint reviews_rating_check check (rating between 1 and 5);

do $$
begin
  alter table public.reviews drop constraint if exists reviews_status_check;
exception when undefined_object then null;
end $$;

alter table public.reviews
  drop constraint if exists reviews_status_check;
alter table public.reviews
  add constraint reviews_status_check check (status in ('pending', 'accepted'));

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_status_idx on public.reviews (status);

create or replace function public.reviews_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.reviews_set_updated_at();

grant usage on schema public to anon, authenticated;
grant insert on table public.reviews to anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant update, delete on table public.reviews to authenticated;

alter table public.reviews enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reviews'
  loop
    execute format('drop policy if exists %I on public.reviews', r.policyname);
  end loop;
end $$;

create policy "reviews_insert_pending_anon"
  on public.reviews for insert
  to anon, authenticated
  with check (
    char_length(trim(author_name)) >= 2
    and char_length(coalesce(author_name, '')) <= 80
    and rating between 1 and 5
    and char_length(trim(body)) >= 10
    and char_length(coalesce(body, '')) <= 1500
    and coalesce(status, 'pending') = 'pending'
  );

create policy "reviews_select_accepted_public"
  on public.reviews for select
  to anon
  using (status = 'accepted');

create policy "reviews_select_authenticated"
  on public.reviews for select
  to authenticated
  using (true);

create policy "reviews_update_authenticated"
  on public.reviews for update
  to authenticated
  using (true)
  with check (status in ('pending', 'accepted'));

create policy "reviews_delete_authenticated"
  on public.reviews for delete
  to authenticated
  using (true);

notify pgrst, 'reload schema';
