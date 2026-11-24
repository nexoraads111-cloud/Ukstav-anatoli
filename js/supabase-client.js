/**
 * Shared Supabase browser client for UKSTAV leads.
 * Requires js/supabase-config.js + @supabase/supabase-js UMD CDN.
 */
;(function (global) {
  const cfg = global.UKSTAV_SUPABASE || {}
  const url = String(cfg.url || '').trim()
  const anonKey = String(cfg.anonKey || '').trim()
  const placeholder =
    !url ||
    !anonKey ||
    /YOUR_PROJECT|YOUR_ANON/i.test(url + anonKey)

  const configured = Boolean(
    !placeholder && url && anonKey && global.supabase?.createClient,
  )

  /** @type {import('@supabase/supabase-js').SupabaseClient | null} */
  const db = configured ? global.supabase.createClient(url, anonKey) : null

  const STATUS_LABELS = {
    new: 'Nový',
    contacted: 'Kontaktovaný',
    done: 'Vybavený',
    spam: 'Spam',
  }

  const SOURCE_LABELS = {
    contact: 'Kontaktný formulár',
    quick: 'Zanechať číslo',
  }

  function formatError(err) {
    if (!err) return 'Neznáma chyba'
    if (typeof err === 'string') return err
    const parts = [err.message, err.error, err.statusCode || err.status, err.code, err.details, err.hint]
      .filter(Boolean)
    return [...new Set(parts.map(String))].join(' · ')
  }

  function normalizeLeadPayload(data) {
    const name = String(data.name || '').trim()
    const phone = String(data.phone || '').trim()
    const description = String(data.description || '').trim()
    const callbackTime = String(data.callback_time || '').trim()
    const source = data.source === 'quick' ? 'quick' : 'contact'

    if (name.length < 2 || phone.replace(/\s/g, '').length < 9) {
      throw new Error('Meno a telefón sú povinné.')
    }

    return {
      name: name.slice(0, 120),
      phone: phone.slice(0, 40),
      description: description ? description.slice(0, 2000) : null,
      callback_time: callbackTime ? callbackTime.slice(0, 40) : null,
      source,
      status: 'new',
    }
  }

  async function submitLead(data) {
    if (!db) {
      throw new Error(
        'Formulár ešte nie je napojený na úložisko. Skontrolujte js/supabase-config.js (pozri SUPABASE.md).',
      )
    }
    const row = normalizeLeadPayload(data)
    const { data: inserted, error } = await db.from('leads').insert(row).select('id').single()
    if (error) {
      error.message = `Uloženie dopytu: ${formatError(error)}`
      throw error
    }
    return inserted
  }

  async function fetchLeads({ status } = {}) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    let query = db.from('leads').select('*').order('created_at', { ascending: false })
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async function updateLead(id, patch) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    if (!id) throw new Error('Chýba id dopytu.')
    const allowed = {}
    if (patch.status) allowed.status = patch.status
    if (patch.notes != null) allowed.notes = String(patch.notes).slice(0, 2000)
    const { error } = await db.from('leads').update(allowed).eq('id', id)
    if (error) throw error
  }

  async function deleteLead(id) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    if (!id) throw new Error('Chýba id dopytu.')
    const { error } = await db.from('leads').delete().eq('id', id)
    if (error) throw error
  }

  global.UkstavLeads = {
    db,
    configured,
    STATUS_LABELS,
    SOURCE_LABELS,
    formatError,
    submitLead,
    fetchLeads,
    updateLead,
    deleteLead,
  }
})(window)
