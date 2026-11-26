/**
 * Senders for the notify-lead Edge Function. Pure functions (env + fetch are passed in)
 * so they can be unit-tested without Deno or the network.
 *
 * Secrets are read from the function environment only (Dashboard → Edge Functions → Secrets):
 *   WhatsApp Cloud API:  WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 *                        optional: WHATSAPP_TO (default 421950405659), WHATSAPP_TEMPLATE,
 *                                  WHATSAPP_TEMPLATE_LANG (default "sk"), WHATSAPP_API_VERSION
 *   Telegram (optional): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

export type Lead = {
  id?: string
  name?: string | null
  phone?: string | null
  description?: string | null
  callback_time?: string | null
  source?: string | null
}

export type Env = Record<string, string | undefined>
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export type SendResult =
  | { channel: string; configured: false }
  | { channel: string; configured: true; id?: string }

const DEFAULT_TO = '421950405659'
const DEFAULT_API_VERSION = 'v23.0'

/** Free-form text inside the message body: keep it readable and bounded. */
export function clip(value: unknown, max: number): string {
  const s = String(value ?? '').replace(/\r\n?/g, '\n').trim()
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** WhatsApp template parameters cannot contain new lines, tabs or 4+ spaces, and cannot be empty. */
export function templateParam(value: unknown, max = 300): string {
  const s = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
  const out = s.length > max ? `${s.slice(0, max - 1)}…` : s
  return out || '-'
}

/** Digits for a wa.me link. Slovak numbers written as 09xx… become 4219xx…; "00421…" → "421…". */
export function waDigits(phone: unknown): string {
  let d = String(phone ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = `421${d.slice(1)}`
  return d.length >= 9 && d.length <= 15 ? d : ''
}

export function buildLeadText(lead: Lead): string {
  const lines = [
    '🔔 *Nový dopyt z ukstav.sk*',
    '',
    `👤 Meno: ${clip(lead.name, 120)}`,
    `📞 Telefón: ${clip(lead.phone, 40)}`,
  ]
  const desc = clip(lead.description, 800)
  if (desc) lines.push(`📝 Popis: ${desc}`)
  const cb = clip(lead.callback_time, 40)
  if (cb) lines.push(`⏰ Čas volania: ${cb}`)
  const wa = waDigits(lead.phone)
  if (wa) lines.push('', `💬 Napísať klientovi: https://wa.me/${wa}`)
  return lines.join('\n')
}

export async function sendWhatsApp(env: Env, lead: Lead, f: FetchLike = fetch): Promise<SendResult> {
  const token = env.WHATSAPP_TOKEN
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return { channel: 'whatsapp', configured: false }

  const to = String(env.WHATSAPP_TO || DEFAULT_TO).replace(/\D/g, '')
  const version = env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION
  const template = (env.WHATSAPP_TEMPLATE || '').trim()

  const body = template
    ? {
        // Business-initiated messages (outside the 24 h customer window) must use an approved template.
        // Expected template body: 3 variables → {{1}} name, {{2}} phone, {{3}} description.
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: (env.WHATSAPP_TEMPLATE_LANG || 'sk').trim() },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: templateParam(lead.name, 120) },
                { type: 'text', text: templateParam(lead.phone, 40) },
                {
                  type: 'text',
                  text: templateParam(
                    [lead.description, lead.callback_time ? `(volať: ${lead.callback_time})` : '']
                      .filter(Boolean)
                      .join(' '),
                    600,
                  ),
                },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: buildLeadText(lead) },
      }

  const res = await f(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneId)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}) as Record<string, unknown>)
  if (!res.ok) {
    const err = (json as { error?: { message?: string; code?: number } }).error
    throw new Error(`WhatsApp ${res.status}${err?.code ? ` #${err.code}` : ''}: ${clip(err?.message || 'error', 200)}`)
  }
  const id = (json as { messages?: { id?: string }[] }).messages?.[0]?.id
  return { channel: 'whatsapp', configured: true, id }
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export async function sendTelegram(env: Env, lead: Lead, f: FetchLike = fetch): Promise<SendResult> {
  const token = env.TELEGRAM_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return { channel: 'telegram', configured: false }

  let text = '🔔 <b>Nový dopyt z ukstav.sk</b>\n\n'
  text += `👤 <b>Meno:</b> ${escapeHtml(clip(lead.name, 120))}\n`
  text += `📞 <b>Telefón:</b> <code>${escapeHtml(clip(lead.phone, 40))}</code>\n`
  const desc = clip(lead.description, 800)
  if (desc) text += `📝 <b>Popis:</b>\n${escapeHtml(desc)}\n`
  const cb = clip(lead.callback_time, 40)
  if (cb) text += `⏰ <b>Čas volania:</b> ${escapeHtml(cb)}\n`

  const res = await f(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string }
  if (!res.ok || !json.ok) throw new Error(`Telegram ${res.status}: ${clip(json.description || 'error', 200)}`)
  return { channel: 'telegram', configured: true }
}
