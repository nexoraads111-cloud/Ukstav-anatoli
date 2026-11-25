# Supabase od nuly — UKSTAV photo CMS + dopyty + recenzie

Tento návod je **čistý štart**. Nevytvárajte nič zo starého PHP / Telegram / WhatsApp
tokenov. GitHub Pages PHP nespúšťa — všetko ide cez **nový** free Supabase projekt.

## Čo dostanete

| Funkcia | Kde |
|---------|-----|
| **Správa všetkých fotiek** | [`admin.html`](./admin.html) — logo, hero, služby, galéria, tím, **každá fotka každého projektu** |
| Ukážka bez Supabase | `admin.html?demo=1` (iba UI, nič sa neukladá) |
| Verejný web | [`js/site-images.js`](./js/site-images.js) načíta fotky; inak lokálne `images/` |
| Dopyty z formulára | Admin → záložka **Dopyty** |
| **Recenzie klientov** | Verejný formulár na homepage → Admin → záložka **Recenzie** (Prijať / Zmazať). Na webe sú len **prijaté**. |

## Krok 1 — Nový projekt Supabase

1. Otvorte [https://supabase.com](https://supabase.com) a prihláste sa.
2. **New project** — odporúčaný región **EU (Frankfurt / Ireland)**.
3. Počkajte, kým bude projekt Ready.
4. **Project Settings → API**:
   - skopírujte **Project URL** (`https://xxxx.supabase.co`)
   - skopírujte **anon / publishable** kľúč  
   - **NEPOUŽÍVAJTE** `service_role` (tajný) v prehliadači ani v gite

## Krok 2 — Kľúče len do config súboru

Upravte **iba** [`js/supabase-config.js`](./js/supabase-config.js) (v repozitári je prázdny):

```js
window.UKSTAV_SUPABASE = {
  url: 'https://VAS_PROJEKT.supabase.co',
  anonKey: 'VAS_ANON_KLUC',
}
```

Vzor: [`js/supabase-config.example.js`](./js/supabase-config.example.js).  
Žiadne iné súbory s tajomstvami. Žiadne staré Telegram/WhatsApp tokeny.

Commit + push na GitHub Pages po kroku 4.

## Krok 3 — SQL (tabuľky + úložisko)

1. Supabase → **SQL Editor** → New query  
2. Vložte celý obsah [`supabase/setup.sql`](./supabase/setup.sql)  
3. **Run**

Vytvorí:

- `site_images` + seed homepage/logo slotov  
- `leads` (formulár)  
- `reviews` (moderované recenzie: `pending` / `accepted`)  
- Storage bucket **`site-images`** (verejné čítanie, zápis len pre prihláseného admina)

### Len recenzie (ak už máte fotky + dopyty)

Ak ste `setup.sql` už spustili skôr a chýba len tabuľka recenzií:

1. SQL Editor → New query  
2. Vložte celý obsah [`supabase/reviews.sql`](./supabase/reviews.sql)  
3. **Run**

RLS v skratke:

| Kto | Čo môže |
|-----|---------|
| Návštevník (anon) | Vložiť recenziu len so stavom **pending**; čítať len **accepted** |
| Admin (authenticated) | Čítať všetky, Prijať (`accepted`), Zmazať |

## Krok 4 — Admin účet (od nuly)

1. **Authentication → Providers → Email** — vypnite verejnú registráciu (Enable sign ups = off).  
2. **Authentication → Users → Add user** — e-mail + silné heslo (to bude login do adminu).  
3. Otvorte `https://ukstav.sk/admin.html` → prihláste sa týmto účtom.

## Krok 5 — Overenie

1. Admin → **Logo / značka** → nahraďte logo.  
2. Admin → **Hero** → nahraďte banner → obnovte homepage.  
3. Admin → **Realizácie** → vyberte projekt → nahraďte ľubovoľnú fotku detailu.  
4. Admin → **Dopyty** — odošlite test z kontaktného formulára.  
5. Homepage → **Napísať recenziu** → odošlite test → Admin → **Recenzie** → **Prijať** → overte, že sa zobrazí na webe.

## Voliteľné: Telegram notifikácie

Len cez Supabase Edge Function so **serverovými** secrets v Dashboarde  
(`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) — pozri `supabase/functions/notify-lead/`.  
**Nedávajte** tokeny do PHP ani do JS. Staré tokeny z gitu rotujte v BotFather / Meta.

## Bezpečnosť (stručne)

| Áno | Nie |
|-----|-----|
| anon kľúč v `js/supabase-config.js` po RLS | `service_role` v gite |
| nový projekt + nový admin user | kopírovanie starých PHP secrets |
| EU región pre údaje | verejná registrácia v Auth |

---

## Príloha — SQL recenzie (skopírujte a spustite)

Supabase → **SQL Editor** → New query → vložte **celý** blok → **Run**.

```sql
-- UKSTAV — reviews table (moderated testimonials)
-- Idempotent: safe to re-run in Supabase SQL Editor.

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
```
