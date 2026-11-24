# Supabase — UKSTAV photo CMS + lead form

Live site is **GitHub Pages** (static). PHP does **not** run there.
Photos and leads use **Supabase** (same pattern as Protile’s admin).

## What you get

| Feature | Where |
|---------|--------|
| **Photo CMS** (primary) | [`admin.html`](./admin.html) — Hero, Služby, Galéria, Tím, Realizácie |
| Upload / replace / reorder / delete | Authenticated admin + Storage bucket `site-images` |
| Public site | [`js/site-images.js`](./js/site-images.js) loads managed images; falls back to local `images/` |
| Contact leads (secondary) | Same admin → tab **Dopyty** |
| Optional Telegram | [`supabase/functions/notify-lead`](./supabase/functions/notify-lead/index.ts) |

## 1. Create a free Supabase project

1. [supabase.com](https://supabase.com) → New project (prefer **EU**, e.g. Frankfurt).
2. Settings → API → copy **Project URL** and **anon / publishable** key.
3. Put them into `js/supabase-config.js`:

```js
window.UKSTAV_SUPABASE = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJhbGciOi…',
}
```

Never commit `service_role`.

## 2. Run SQL

SQL Editor → paste [`supabase/setup.sql`](./supabase/setup.sql) → Run.

Creates:

- `leads` (anon insert, auth manage)
- `site_images` (public read, auth write) + seed of current static photos
- Storage bucket **`site-images`** (public read, auth upload/update/delete)

## 3. Admin user

Authentication → Users → **Add user** (email + password).  
Disable public sign-ups.

Open `https://ukstav.sk/admin.html` → sign in → manage photos.

## 4. How photo slots work

| Sekcia | Správanie |
|--------|-----------|
| **Hero** | 1 slot `hero` — nahranie nahradí banner |
| **Služby** | Sloty kariet + featured fotka |
| **Tím** | `team-1` … `team-3` |
| **Galéria** | Viac fotiek, ↑↓ poradie; nahradí mriežku na homepage |
| **Realizácie** | Náhľadové fotky viazané na `project1`…`project10` |

Lokálne cesty `images/…` v seede ostávajú, kým ich nenahradíte uploadom do Storage.

## 5. Optional Telegram

Deploy `notify-lead` Edge Function; set secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`;
webhook on `leads` INSERT. Rotate any tokens formerly hardcoded in git.

## 6. Smoke test

1. Fill config + run SQL + create user.
2. Admin → replace hero → refresh homepage.
3. Admin → Galéria → upload + reorder → check `#gallery`.
4. Admin → Realizácie → set project cover → check `#works`.
