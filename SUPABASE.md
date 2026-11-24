# Supabase — UKSTAV lead form + admin

Live site is **GitHub Pages** (static). PHP like `send-telegram.php` does **not** run there
(POST → 405). Leads are stored in **Supabase Postgres** with Row Level Security — same
GitHub-Pages-friendly pattern as Protile’s admin (`protile.cz-`).

Public form → `insert` into `leads` (anon key).  
Admin → [`admin.html`](./admin.html) with Supabase Auth (email + password).

## 1. Create a free Supabase project

1. Open [supabase.com](https://supabase.com) → New project (EU region preferred, e.g. Frankfurt).
2. Project Settings → API → copy **Project URL** and **anon / publishable** key.
3. Put them into `js/supabase-config.js` (copy from `js/supabase-config.example.js` if needed).

```js
window.UKSTAV_SUPABASE = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJhbGciOi…', // or sb_publishable_…
}
```

The anon key is safe in the browser **only** with RLS (see step 2). Never commit `service_role`.

## 2. Create the `leads` table + policies

Supabase → SQL Editor → paste and run [`supabase/setup.sql`](./supabase/setup.sql).

Summary:

| Role | Can |
|------|-----|
| `anon` (website) | `INSERT` new leads only |
| `authenticated` (admin) | `SELECT` / `UPDATE` / `DELETE` |

Public visitors cannot read other people’s leads.

## 3. Admin user

Authentication → Users → **Add user** (email + password).  
Disable public sign-ups (Authentication → Providers → Email → turn off “Enable sign ups” if available).

Sign in at `https://ukstav.sk/admin.html` (or `/admin.html` on Pages).

## 4. Optional Telegram notify (server-side secrets)

Broken PHP on Pages exposed bot tokens in the repo — those must be **rotated** and never
put back into public files.

Optional path that keeps secrets server-side:

1. Deploy [`supabase/functions/notify-lead`](./supabase/functions/notify-lead/index.ts).
2. Set Edge Function secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
3. Add a Database Webhook on `public.leads` INSERT → that function.

Form + admin work without Telegram.

## 5. Smoke test

1. Open the site → Kontakt → send a test lead.
2. Open `/admin.html` → sign in → lead appears → change status / delete.
3. Confirm privacy page text matches (Supabase as recipient, no fake PHP Telegram claims).

## 6. Commit config?

Protile bakes the anon key into the static site. You may commit `js/supabase-config.js`
with the **anon** key after RLS is applied. Prefer rotating if the key ever leaked with
overly open policies.
