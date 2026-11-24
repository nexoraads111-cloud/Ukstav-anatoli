# Supabase od nuly — UKSTAV photo CMS + dopyty

Tento návod je **čistý štart**. Nevytvárajte nič zo starého PHP / Telegram / WhatsApp
tokenov. GitHub Pages PHP nespúšťa — všetko ide cez **nový** free Supabase projekt.

## Čo dostanete

| Funkcia | Kde |
|---------|-----|
| **Správa všetkých fotiek** | [`admin.html`](./admin.html) — logo, hero, služby, galéria, tím, **každá fotka každého projektu** |
| Ukážka bez Supabase | `admin.html?demo=1` (iba UI, nič sa neukladá) |
| Verejný web | [`js/site-images.js`](./js/site-images.js) načíta fotky; inak lokálne `images/` |
| Dopyty z formulára | Admin → záložka **Dopyty** |

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
- Storage bucket **`site-images`** (verejné čítanie, zápis len pre prihláseného admina)

## Krok 4 — Admin účet (od nuly)

1. **Authentication → Providers → Email** — vypnite verejnú registráciu (Enable sign ups = off).  
2. **Authentication → Users → Add user** — e-mail + silné heslo (to bude login do adminu).  
3. Otvorte `https://ukstav.sk/admin.html` → prihláste sa týmto účtom.

## Krok 5 — Overenie

1. Admin → **Logo / značka** → nahraďte logo.  
2. Admin → **Hero** → nahraďte banner → obnovte homepage.  
3. Admin → **Realizácie** → vyberte projekt → nahraďte ľubovoľnú fotku detailu.  
4. Admin → **Dopyty** — odošlite test z kontaktného formulára.

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
