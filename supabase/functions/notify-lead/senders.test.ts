// Run:  node --experimental-strip-types --test supabase/functions/notify-lead/senders.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLeadText, sendTelegram, sendWhatsApp, templateParam, waDigits } from './senders.ts'

type Call = { url: string; init: RequestInit }
const okFetch = (payload: unknown, status = 200) => {
  const calls: Call[] = []
  const f = async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(payload), { status })
  }
  return { f, calls }
}
const lead = {
  name: 'Ján Novák',
  phone: '0903 123 456',
  description: 'Rekonštrukcia kúpeľne\nBratislava <b>',
  callback_time: 'po 17:00',
  source: 'contact',
}

test('waDigits normalises Slovak numbers', () => {
  assert.equal(waDigits('0903 123 456'), '421903123456')
  assert.equal(waDigits('+421 903 123 456'), '421903123456')
  assert.equal(waDigits('00421903123456'), '421903123456')
  assert.equal(waDigits('12'), '')
  assert.equal(waDigits(null), '')
})

test('templateParam strips newlines/tabs/long spaces, never empty, bounded', () => {
  assert.equal(templateParam('a\nb\t c    d'), 'a b c d')
  assert.equal(templateParam('   '), '-')
  assert.equal(templateParam(undefined), '-')
  assert.equal(templateParam('x'.repeat(500), 100).length, 100)
})

test('buildLeadText contains the lead data and a wa.me link', () => {
  const t = buildLeadText(lead)
  assert.match(t, /Ján Novák/)
  assert.match(t, /0903 123 456/)
  assert.match(t, /Rekonštrukcia kúpeľne/)
  assert.match(t, /Čas volania: po 17:00/)
  assert.match(t, /https:\/\/wa\.me\/421903123456/)
})

test('WhatsApp: not configured without token / phone id', async () => {
  const { f, calls } = okFetch({})
  assert.deepEqual(await sendWhatsApp({}, lead, f), { channel: 'whatsapp', configured: false })
  assert.deepEqual(await sendWhatsApp({ WHATSAPP_TOKEN: 't' }, lead, f), { channel: 'whatsapp', configured: false })
  assert.equal(calls.length, 0)
})

test('WhatsApp: free-form text request to the owner number', async () => {
  const { f, calls } = okFetch({ messages: [{ id: 'wamid.1' }] })
  const r = await sendWhatsApp({ WHATSAPP_TOKEN: 'TOKEN', WHATSAPP_PHONE_NUMBER_ID: '123456' }, lead, f)
  assert.deepEqual(r, { channel: 'whatsapp', configured: true, id: 'wamid.1' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://graph.facebook.com/v23.0/123456/messages')
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer TOKEN')
  const body = JSON.parse(String(calls[0].init.body))
  assert.equal(body.messaging_product, 'whatsapp')
  assert.equal(body.to, '421950405659')
  assert.equal(body.type, 'text')
  assert.match(body.text.body, /Ján Novák/)
})

test('WhatsApp: approved template with 3 parameters, no newlines in them', async () => {
  const { f, calls } = okFetch({ messages: [{ id: 'wamid.2' }] })
  await sendWhatsApp(
    {
      WHATSAPP_TOKEN: 'T',
      WHATSAPP_PHONE_NUMBER_ID: '9',
      WHATSAPP_TEMPLATE: 'new_lead',
      WHATSAPP_TEMPLATE_LANG: 'sk',
      WHATSAPP_TO: '+421 950 405 659',
      WHATSAPP_API_VERSION: 'v24.0',
    },
    lead,
    f,
  )
  assert.equal(calls[0].url, 'https://graph.facebook.com/v24.0/9/messages')
  const body = JSON.parse(String(calls[0].init.body))
  assert.equal(body.type, 'template')
  assert.equal(body.to, '421950405659')
  assert.equal(body.template.name, 'new_lead')
  assert.equal(body.template.language.code, 'sk')
  const params = body.template.components[0].parameters.map((p: { text: string }) => p.text)
  assert.equal(params.length, 3)
  assert.equal(params[0], 'Ján Novák')
  assert.equal(params[1], '0903 123 456')
  assert.match(params[2], /Rekonštrukcia kúpeľne Bratislava/)
  assert.match(params[2], /po 17:00/)
  for (const p of params) assert.ok(!/[\n\t]/.test(p) && p.length > 0)
})

test('WhatsApp: API error → throws without leaking the token', async () => {
  const { f } = okFetch({ error: { message: 'Recipient phone number not in allowed list', code: 131030 } }, 400)
  await assert.rejects(
    () => sendWhatsApp({ WHATSAPP_TOKEN: 'SECRET-TOKEN', WHATSAPP_PHONE_NUMBER_ID: '1' }, lead, f),
    (e: Error) => /400 #131030/.test(e.message) && !e.message.includes('SECRET-TOKEN'),
  )
})

test('Telegram: escapes HTML and reports API failure', async () => {
  const ok = okFetch({ ok: true })
  assert.deepEqual(await sendTelegram({ TELEGRAM_BOT_TOKEN: 'b', TELEGRAM_CHAT_ID: '1' }, lead, ok.f), {
    channel: 'telegram',
    configured: true,
  })
  const sent = JSON.parse(String(ok.calls[0].init.body))
  assert.match(sent.text, /&lt;b&gt;/)
  assert.ok(!sent.text.includes('<b>Bratislava'))
  assert.deepEqual(await sendTelegram({}, lead, ok.f), { channel: 'telegram', configured: false })
  const bad = okFetch({ ok: false, description: 'chat not found' }, 400)
  await assert.rejects(() => sendTelegram({ TELEGRAM_BOT_TOKEN: 'b', TELEGRAM_CHAT_ID: '1' }, lead, bad.f), /chat not found/)
})
