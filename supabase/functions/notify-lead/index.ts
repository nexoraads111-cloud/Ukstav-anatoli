/**
 * Edge Function: deliver a new lead (public.leads row) to WhatsApp (and optionally Telegram).
 *
 * Called by the database trigger `leads_notify` (pg_net) right after INSERT with { "lead_id": "<uuid>" }.
 * Deployed with verify_jwt = false because the caller is the database, not a signed-in user. It is safe:
 *   - the body only carries a lead id; the lead is read with the service-role key (never leaves the server);
 *   - a lead is "claimed" atomically (notified_at) so repeated/forged calls cannot send it twice;
 *   - at most MAX_PER_HOUR notifications per hour (the public form has its own limits too);
 *   - provider tokens live only in Edge Function secrets, never in the repo or the browser.
 *
 * Secrets: see senders.ts. Setup steps: SUPABASE.md → "Заявки на WhatsApp автоматично".
 * Leads are always saved in Postgres, whatever happens here.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendTelegram, sendWhatsApp, type Lead, type SendResult } from './senders.ts'

const MAX_PER_HOUR = 20
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const JSON_HEADERS = { 'Content-Type': 'application/json' }

const reply = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ ok: false, error: 'method_not_allowed' }, 405)

  let payload: { lead_id?: unknown; record?: { id?: unknown } }
  try {
    payload = await req.json()
  } catch {
    return reply({ ok: false, error: 'bad_json' }, 400)
  }
  const id = String(payload?.lead_id ?? payload?.record?.id ?? '')
  if (!UUID.test(id)) return reply({ ok: false, error: 'bad_id' }, 400)

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return reply({ ok: false, error: 'server_not_configured' }, 500)
  const db = createClient(url, key, { auth: { persistSession: false } })

  // Flood brake for notifications.
  const since = new Date(Date.now() - 3600_000).toISOString()
  const { count } = await db
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('notified_at', since)
  if ((count ?? 0) >= MAX_PER_HOUR) {
    await db.from('leads').update({ notify_error: 'rate_limited' }).eq('id', id).is('notified_at', null)
    return reply({ ok: false, skipped: 'rate_limited' })
  }

  // Claim the lead (only one caller wins).
  const { data: lead, error: claimErr } = await db
    .from('leads')
    .update({ notified_at: new Date().toISOString(), notify_error: null })
    .eq('id', id)
    .is('notified_at', null)
    .select('id, name, phone, description, callback_time, source')
    .maybeSingle()
  if (claimErr) return reply({ ok: false, error: 'db_error' }, 500)
  if (!lead) return reply({ ok: true, skipped: 'already_sent_or_missing' })

  const env = Deno.env.toObject()
  const settled = await Promise.allSettled([sendWhatsApp(env, lead as Lead), sendTelegram(env, lead as Lead)])

  const sent: string[] = []
  const errors: string[] = []
  let configured = 0
  for (const r of settled) {
    if (r.status === 'rejected') {
      configured++
      errors.push(String(r.reason?.message || r.reason).slice(0, 300))
    } else {
      const v = r.value as SendResult
      if (v.configured) {
        configured++
        sent.push(v.channel)
      }
    }
  }

  if (sent.length) {
    await db
      .from('leads')
      .update({ notify_channel: sent.join(','), notify_error: errors.length ? errors.join(' | ') : null })
      .eq('id', id)
    return reply({ ok: true, sent })
  }

  // Nothing delivered: release the claim so the problem is visible in the admin and can be retried.
  const reason = configured ? errors.join(' | ') : 'not_configured'
  await db.from('leads').update({ notified_at: null, notify_error: reason }).eq('id', id)
  return reply({ ok: false, error: reason }, configured ? 502 : 200)
})
