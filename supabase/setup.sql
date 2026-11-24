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
    check (category in ('hero', 'services', 'gallery', 'team', 'works')),
  slot text,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
insert into public.site_images (id, category, slot, storage_path, alt_text, sort_order)
values
  ('b1000000-0000-4000-8000-000000000001', 'hero', 'hero', 'images/hero-house.jpg', 'Hero — dom UKSTAV', 1),
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
  ('b1000000-0000-4000-8000-000000000038', 'gallery', null, 'images/project8-1.jpeg', 'Minimalistická kúpeľňa', 9),
  ('b1000000-0000-4000-8000-000000000040', 'works', 'project1', 'images/project1-1.jpg', 'Realizácia 1 — náhľad', 1),
  ('b1000000-0000-4000-8000-000000000041', 'works', 'project2', 'images/project2-1.jpg', 'Realizácia 2 — náhľad', 2),
  ('b1000000-0000-4000-8000-000000000042', 'works', 'project3', 'images/project3-1.jpg', 'Realizácia 3 — náhľad', 3),
  ('b1000000-0000-4000-8000-000000000043', 'works', 'project4', 'images/project4-1.jpeg', 'Realizácia 4 — náhľad', 4),
  ('b1000000-0000-4000-8000-000000000044', 'works', 'project5', 'images/project5-1.jpeg', 'Realizácia 5 — náhľad', 5),
  ('b1000000-0000-4000-8000-000000000045', 'works', 'project6', 'images/project6-1.jpeg', 'Realizácia 6 — náhľad', 6),
  ('b1000000-0000-4000-8000-000000000046', 'works', 'project7', 'images/project7-1.jpeg', 'Realizácia 7 — náhľad', 7),
  ('b1000000-0000-4000-8000-000000000047', 'works', 'project8', 'images/project8-1.jpeg', 'Realizácia 8 — náhľad', 8),
  ('b1000000-0000-4000-8000-000000000048', 'works', 'project9', 'images/project9-1.jpeg', 'Realizácia 9 — náhľad', 9),
  ('b1000000-0000-4000-8000-000000000049', 'works', 'project10', 'images/project10-1.jpeg', 'Realizácia 10 — náhľad', 10)
on conflict (id) do update set
  category = excluded.category,
  slot = excluded.slot,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
