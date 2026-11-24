/**
 * Optional Supabase Edge Function: Telegram notify on new lead.
 * Secrets stay server-side (Dashboard → Edge Functions → Secrets):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *
 * Deploy after `supabase functions deploy notify-lead`.
 * Wire via Database Webhook on public.leads INSERT, or call from a DB trigger.
 *
 * This function is NOT required for the form/admin to work — leads are stored
 * in Postgres either way.
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const payload = await req.json()
    const record = payload.record || payload
    const name = String(record.name || '').trim()
    const phone = String(record.phone || '').trim()
    const description = String(record.description || '').trim()
    const callback = String(record.callback_time || '').trim()
    const source = String(record.source || 'contact').trim()

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
    if (!token || !chatId) {
      return new Response(JSON.stringify({ ok: false, reason: 'telegram_not_configured' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    let text = `🔔 <b>Nový dopyt z ukstav.sk</b>\n\n`
    text += `👤 <b>Meno:</b> ${escapeHtml(name)}\n`
    text += `📞 <b>Telefón:</b> <code>${escapeHtml(phone)}</code>\n`
    text += `🏷 <b>Zdroj:</b> ${escapeHtml(source)}\n`
    if (description) text += `📝 <b>Popis:</b>\n${escapeHtml(description)}\n`
    if (callback) text += `⏰ <b>Čas volania:</b> ${escapeHtml(callback)}\n`
    text += `\n🕐 ${new Date().toLocaleString('sk-SK')}`

    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    const body = await tg.json()

    return new Response(JSON.stringify({ ok: Boolean(body.ok), telegram: body }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
