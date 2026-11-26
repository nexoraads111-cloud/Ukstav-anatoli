-- UKSTAV — leads + photo CMS (portfolio gallery) + moderated reviews
-- GitHub Pages (static site) + Supabase.
--
-- Safe to re-run in Supabase SQL Editor (idempotent, never deletes your data).
--
-- BEFORE running: create the administrator account in
--   Dashboard -> Authentication -> Users -> Add user  (e-mail + strong password)
-- and make sure its e-mail matches the one in the "admin allow-list" section below.
--
-- SECURITY MODEL
--   * The website only ever holds the public anon key (it is visible in the page source).
--   * Visitors (anon) may ONLY: read photos, read accepted reviews, create a lead,
--     create a pending review. They can never read leads or pending reviews.
--   * Everything else (upload/delete photos, read/edit leads, accept/delete reviews)
--     requires the logged-in user to be listed in public.admin_users. A random account
--     registered through the public Auth API has NO rights, even if sign-ups are open.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admin allow-list
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "admin_users_read_self" on public.admin_users;
create policy "admin_users_read_self"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Administrator = this e-mail (change it if the admin account uses another address).
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('ukstav.sk@gmail.com')
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

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
  updated_at timestamptz not null default now(),
  -- WhatsApp/Telegram delivery tracking (written only by the notify-lead Edge Function)
  notified_at timestamptz,
  notify_channel text,
  notify_error text
);

alter table public.leads add column if not exists notified_at timestamptz;
alter table public.leads add column if not exists notify_channel text;
alter table public.leads add column if not exists notify_error text;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

create or replace function public.leads_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.leads_set_updated_at();

-- Simple flood brake for the public form: max 3 requests / phone / hour, 40 / 10 minutes overall.
create or replace function public.leads_throttle()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.leads
        where phone = new.phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Príliš veľa požiadaviek z tohto čísla. Zavolajte nám alebo napíšte na WhatsApp.';
  end if;
  if (select count(*) from public.leads
        where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'Formulár je dočasne preťažený. Zavolajte nám alebo napíšte na WhatsApp.';
  end if;
  return new;
end;
$$;

revoke execute on function public.leads_throttle() from public, anon, authenticated;

drop trigger if exists leads_throttle on public.leads;
create trigger leads_throttle
  before insert on public.leads
  for each row execute function public.leads_throttle();

-- Instant delivery of every new lead to WhatsApp: the trigger asks the `notify-lead` Edge Function
-- (supabase/functions/notify-lead, secrets in Dashboard → Edge Functions → Secrets) to send it.
-- The call is asynchronous (pg_net) and wrapped so a failure can NEVER block saving the lead.
-- If you use another Supabase project, change the URL below to https://<project-ref>.supabase.co/functions/v1/notify-lead
create extension if not exists pg_net with schema extensions;

create or replace function public.leads_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform net.http_post(
      url := 'https://gqcogdqqgxzuteaoaxza.supabase.co/functions/v1/notify-lead',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('lead_id', new.id),
      timeout_milliseconds := 5000
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;

revoke execute on function public.leads_notify() from public, anon, authenticated;

create or replace trigger leads_notify
  after insert on public.leads
  for each row execute function public.leads_notify();

alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant insert on table public.leads to anon, authenticated;
grant select, delete on table public.leads to authenticated;
grant update (status, notes) on table public.leads to authenticated;
-- The notify-lead Edge Function (service role) reads the lead and records the delivery result.
grant select, update on table public.leads to service_role;

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

create policy "leads_insert_public"
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
    and notes is null
    and notified_at is null
    and notify_channel is null
    and notify_error is null
  );

create policy "leads_select_admin"
  on public.leads for select to authenticated
  using ((select public.is_admin()));

create policy "leads_update_admin"
  on public.leads for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "leads_delete_admin"
  on public.leads for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Site images (photo CMS + photos added to the unified "Realizácie" gallery)
-- ---------------------------------------------------------------------------
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('brand', 'hero', 'services', 'gallery', 'team', 'works')),
  slot text,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  work_types text[] not null default '{}',
  project_id text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_images add column if not exists category text;
alter table public.site_images add column if not exists slot text;
alter table public.site_images add column if not exists storage_path text;
alter table public.site_images add column if not exists alt_text text;
alter table public.site_images add column if not exists sort_order int not null default 0;
alter table public.site_images add column if not exists updated_at timestamptz not null default now();
-- Gallery filters: which work types a photo belongs to + optional link to a project detail page
alter table public.site_images add column if not exists work_types text[] not null default '{}';
alter table public.site_images add column if not exists project_id text;
alter table public.site_images add column if not exists is_visible boolean not null default true;

alter table public.site_images drop constraint if exists site_images_category_check;
alter table public.site_images
  add constraint site_images_category_check
  check (category in ('brand', 'hero', 'services', 'gallery', 'team', 'works'));

alter table public.site_images drop constraint if exists site_images_work_types_check;
alter table public.site_images
  add constraint site_images_work_types_check
  check (cardinality(work_types) <= 12);

alter table public.site_images drop constraint if exists site_images_project_id_check;
alter table public.site_images
  add constraint site_images_project_id_check
  check (project_id is null or project_id ~ '^[a-z0-9_-]{1,40}$');

create index if not exists site_images_category_sort_idx
  on public.site_images (category, sort_order asc, created_at desc);

create index if not exists site_images_slot_idx
  on public.site_images (slot);

create or replace function public.site_images_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_images_updated_at on public.site_images;
create trigger site_images_updated_at
  before update on public.site_images
  for each row execute function public.site_images_set_updated_at();

alter table public.site_images enable row level security;

revoke all on table public.site_images from anon, authenticated;
grant select on table public.site_images to anon, authenticated;
grant insert, update, delete on table public.site_images to authenticated;

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

create policy "site_images_insert_admin"
  on public.site_images for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "site_images_update_admin"
  on public.site_images for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "site_images_delete_admin"
  on public.site_images for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage bucket (public read through the public URL; write = admin only)
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
drop policy if exists "Admin read site-images" on storage.objects;
drop policy if exists "Admin upload site-images" on storage.objects;
drop policy if exists "Admin update site-images" on storage.objects;
drop policy if exists "Admin delete site-images" on storage.objects;

-- No public SELECT policy on purpose: the public URL of a file keeps working,
-- but strangers cannot list what is in the bucket.
create policy "Admin read site-images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admin upload site-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admin update site-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()))
  with check (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admin delete site-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Fixed homepage slots (logo / hero / services / team). Never overwrites a photo
-- you already replaced in the admin. The gallery photos themselves are seeded
-- by supabase/seed-gallery.sql (run it once after this script).
-- ---------------------------------------------------------------------------
insert into public.site_images (id, category, slot, storage_path, alt_text, sort_order)
values
  ('b1000000-0000-4000-8000-000000000001', 'brand', 'favicon', 'images/ukstav_logo_2.png', 'Favicon UKSTAV', 1),
  ('b1000000-0000-4000-8000-000000000002', 'brand', 'logo-nav', 'images/ukstav_logo_2.png', 'Logo navigácia', 2),
  ('b1000000-0000-4000-8000-000000000003', 'brand', 'logo-footer', 'images/ukstav_logo_2.png', 'Logo pätička', 3),
  ('b1000000-0000-4000-8000-000000000004', 'hero', 'hero', 'images/hero-house.jpg', 'Hero — dom UKSTAV', 1),
  ('b1000000-0000-4000-8000-000000000005', 'hero', 'hero-light', 'images/hero-light.jpg', 'Hero — svetlá téma', 2),
  ('b1000000-0000-4000-8000-000000000010', 'services', 'service-house', 'images/service-house.jpg', 'Služba — domy na kľúč', 1),
  ('b1000000-0000-4000-8000-000000000011', 'services', 'service-reconstruction', 'images/service-reconstruction.jpg', 'Služba — rekonštrukcie', 2),
  ('b1000000-0000-4000-8000-000000000012', 'services', 'service-facade', 'images/service-facade.jpg', 'Služba — fasády a interiéry', 3),
  ('b1000000-0000-4000-8000-000000000013', 'services', 'service-featured', 'images/service-featured.jpg', 'Služby — featured realizácia', 4),
  ('b1000000-0000-4000-8000-000000000020', 'team', 'team-1', 'images/team-member-1.jpg', 'Anatolij Porokhnavets', 1),
  ('b1000000-0000-4000-8000-000000000021', 'team', 'team-2', 'images/team-member-2.jpg', 'Mihajlo Kovač', 2),
  ('b1000000-0000-4000-8000-000000000022', 'team', 'team-3', 'images/team-member-3.jpg', 'Oleksandr Zmenytko', 3)
on conflict (id) do nothing;

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

alter table public.reviews add column if not exists author_name text;
alter table public.reviews add column if not exists rating int;
alter table public.reviews add column if not exists body text;
alter table public.reviews add column if not exists status text not null default 'pending';
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

alter table public.reviews drop constraint if exists reviews_rating_check;
alter table public.reviews
  add constraint reviews_rating_check check (rating between 1 and 5);

alter table public.reviews drop constraint if exists reviews_status_check;
alter table public.reviews
  add constraint reviews_status_check check (status in ('pending', 'accepted'));

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_status_idx on public.reviews (status);

create or replace function public.reviews_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.reviews_set_updated_at();

-- Flood brake: at most 10 new reviews per hour overall (they all wait for moderation anyway).
create or replace function public.reviews_throttle()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.reviews
        where created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Recenzie sú dočasne preťažené. Skúste to prosím neskôr.';
  end if;
  return new;
end;
$$;

revoke execute on function public.reviews_throttle() from public, anon, authenticated;

drop trigger if exists reviews_throttle on public.reviews;
create trigger reviews_throttle
  before insert on public.reviews
  for each row execute function public.reviews_throttle();

alter table public.reviews enable row level security;

revoke all on table public.reviews from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert on table public.reviews to anon, authenticated;
grant delete on table public.reviews to authenticated;
grant update (status) on table public.reviews to authenticated;

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
create policy "reviews_insert_pending_public"
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

-- Public site: only accepted reviews. The admin additionally sees pending ones.
create policy "reviews_select_accepted_public"
  on public.reviews for select
  to anon
  using (status = 'accepted');

create policy "reviews_select_authenticated"
  on public.reviews for select
  to authenticated
  using (status = 'accepted' or (select public.is_admin()));

create policy "reviews_update_admin"
  on public.reviews for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and status in ('pending', 'accepted'));

create policy "reviews_delete_admin"
  on public.reviews for delete
  to authenticated
  using ((select public.is_admin()));

notify pgrst, 'reload schema';
