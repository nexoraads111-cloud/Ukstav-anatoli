/**
 * Copy values into `supabase-config.js` from a NEW Supabase project:
 * Dashboard → Project Settings → API → Project URL + anon/publishable key.
 * Never use service_role. Never reuse old PHP/Telegram secrets.
 */
window.UKSTAV_SUPABASE = {
  url: 'https://YOUR_NEW_PROJECT.supabase.co',
  anonKey: 'YOUR_NEW_ANON_OR_PUBLISHABLE_KEY',
}
