-- UKSTAV — leads + site photo CMS (GitHub Pages + Supabase)
-- Idempotent: safe to re-run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Leads (contact form)
-- ---------------------------------------------------------------------------
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

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

create or replace function public.leads_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.leads_set_updated_at();

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
  on public.leads for select to authenticated using (true);

create policy "leads_update_authenticated"
  on public.leads for update to authenticated using (true) with check (true);

create policy "leads_delete_authenticated"
  on public.leads for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Site images (photo CMS)
-- ---------------------------------------------------------------------------
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('brand', 'hero', 'services', 'gallery', 'team', 'works')),
  slot text,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Allow brand category on existing DBs created before this revision
do $$
begin
  alter table public.site_images drop constraint if exists site_images_category_check;
exception when undefined_object then null;
end $$;

alter table public.site_images
  drop constraint if exists site_images_category_check;

alter table public.site_images
  add constraint site_images_category_check
  check (category in ('brand', 'hero', 'services', 'gallery', 'team', 'works'));

alter table public.site_images
  add column if not exists category text;
alter table public.site_images
  add column if not exists slot text;
alter table public.site_images
  add column if not exists storage_path text;
alter table public.site_images
  add column if not exists alt_text text;
alter table public.site_images
  add column if not exists sort_order int not null default 0;
alter table public.site_images
  add column if not exists updated_at timestamptz not null default now();

create index if not exists site_images_category_sort_idx
  on public.site_images (category, sort_order asc, created_at desc);

create index if not exists site_images_slot_idx
  on public.site_images (slot);

create or replace function public.site_images_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_images_updated_at on public.site_images;
create trigger site_images_updated_at
  before update on public.site_images
  for each row execute function public.site_images_set_updated_at();

grant select on table public.site_images to anon, authenticated;
grant insert, update, delete on table public.site_images to authenticated;

alter table public.site_images enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'site_images'
  loop
    execute format('drop policy if exists %I on public.site_images', r.policyname);
  end loop;
end $$;

create policy "site_images_select_public"
  on public.site_images for select
  to anon, authenticated
  using (true);

create policy "site_images_insert_authenticated"
  on public.site_images for insert
  to authenticated
  with check (true);

create policy "site_images_update_authenticated"
  on public.site_images for update
  to authenticated
  using (true) with check (true);

create policy "site_images_delete_authenticated"
  on public.site_images for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

drop policy if exists "Public read site-images" on storage.objects;
drop policy if exists "Auth upload site-images" on storage.objects;
drop policy if exists "Auth update site-images" on storage.objects;
drop policy if exists "Auth delete site-images" on storage.objects;

create policy "Public read site-images"
  on storage.objects for select
  using (bucket_id = 'site-images');

create policy "Auth upload site-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images');

create policy "Auth update site-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images');

create policy "Auth delete site-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images');

-- ---------------------------------------------------------------------------
-- Seed current static site photos (site-relative paths) so admin sees them
-- ---------------------------------------------------------------------------
-- Fixed homepage / brand slots (local paths until replaced in admin).
-- Project detail photos (174+) are managed in admin under Realizácie by project —
-- each path in projects.js is a replaceable slot without needing a full SQL seed.
insert into public.site_images (id, category, slot, storage_path, alt_text, sort_order)
values
  ('b1000000-0000-4000-8000-000000000001', 'brand', 'favicon', 'images/ukstav_logo_2.png', 'Favicon UKSTAV', 1),
  ('b1000000-0000-4000-8000-000000000002', 'brand', 'logo-nav', 'images/ukstav_logo_2.png', 'Logo navigácia', 2),
  ('b1000000-0000-4000-8000-000000000003', 'brand', 'logo-footer', 'images/ukstav_logo_2.png', 'Logo pätička', 3),
  ('b1000000-0000-4000-8000-000000000004', 'hero', 'hero', 'images/hero-house.jpg', 'Hero — dom UKSTAV', 1),
  ('b1000000-0000-4000-8000-000000000005', 'hero', 'hero-alt', 'images/hero-bg.jpg', 'Hero — alternatívne pozadie', 2),
  ('b1000000-0000-4000-8000-000000000010', 'services', 'service-house', 'images/service-house.jpg', 'Služba — domy na kľúč', 1),
  ('b1000000-0000-4000-8000-000000000011', 'services', 'service-reconstruction', 'images/service-reconstruction.jpg', 'Služba — rekonštrukcie', 2),
  ('b1000000-0000-4000-8000-000000000012', 'services', 'service-facade', 'images/service-facade.jpg', 'Služba — fasády a interiéry', 3),
  ('b1000000-0000-4000-8000-000000000013', 'services', 'service-featured', 'images/service-featured.jpg', 'Služby — featured realizácia', 4),
  ('b1000000-0000-4000-8000-000000000020', 'team', 'team-1', 'images/team-member-1.jpg', 'Anatolij Porokhnavets', 1),
  ('b1000000-0000-4000-8000-000000000021', 'team', 'team-2', 'images/team-member-2.jpg', 'Mihajlo Kovač', 2),
  ('b1000000-0000-4000-8000-000000000022', 'team', 'team-3', 'images/team-member-3.jpg', 'Oleksandr Zmenytko', 3),
  ('b1000000-0000-4000-8000-000000000030', 'gallery', null, 'images/ukstav_header_logo_3.jpg', 'Hotová realizácia — záhradný objekt', 1),
  ('b1000000-0000-4000-8000-000000000031', 'gallery', null, 'images/project2-8.jpg', 'Hruba stavba — debnenie a výstuž', 2),
  ('b1000000-0000-4000-8000-000000000032', 'gallery', null, 'images/project3-1.jpg', 'Výstavba domu — krov', 3),
  ('b1000000-0000-4000-8000-000000000033', 'gallery', null, 'images/project1-1.jpg', 'Moderná kúpeľňa', 4),
  ('b1000000-0000-4000-8000-000000000034', 'gallery', null, 'images/project5-1.jpeg', 'Rekonštrukcia bytu', 5),
  ('b1000000-0000-4000-8000-000000000035', 'gallery', null, 'images/project4-1.jpeg', 'Chodníky okolo domu', 6),
  ('b1000000-0000-4000-8000-000000000036', 'gallery', null, 'images/project7-1.jpeg', 'Rekonštrukcia kuchyne', 7),
  ('b1000000-0000-4000-8000-000000000037', 'gallery', null, 'images/project10-1.jpeg', 'Rekonštrukcia masážneho salónu', 8),
  ('b1000000-0000-4000-8000-000000000038', 'gallery', null, 'images/project8-1.jpeg', 'Minimalistická kúpeľňa', 9)
on conflict (id) do update set
  category = excluded.category,
  slot = excluded.slot,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Reviews (public site testimonials — moderated)
-- ---------------------------------------------------------------------------
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

-- Visitors may only create pending reviews (validated lengths).
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

-- Public site: only accepted reviews.
create policy "reviews_select_accepted_public"
  on public.reviews for select
  to anon
  using (status = 'accepted');

-- Admin (authenticated): see pending + accepted, accept/delete.
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
