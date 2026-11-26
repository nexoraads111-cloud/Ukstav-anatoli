/**
 * Shared Supabase browser client for UKSTAV (leads + site photo CMS + reviews).
 * Requires js/supabase-config.js + @supabase/supabase-js UMD CDN.
 *
 * Security model: this file only ever holds the public anon key. All writes to
 * photos / leads / reviews are limited to the admin account by Row Level Security
 * (supabase/setup.sql) — hiding or changing this JS cannot grant extra rights.
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

  const SITE_BUCKET = 'site-images'
  const MAX_BYTES = 5 * 1024 * 1024
  const ALLOWED_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/pjpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  const CATEGORIES = {
    brand: 'Logo / značka',
    hero: 'Hero',
    services: 'Služby',
    gallery: 'Realizácie a galéria (pridať fotky)',
    team: 'Tím',
    works: 'Nahradiť fotku projektu',
  }

  const FIXED_SLOTS = {
    brand: [
      { slot: 'favicon', label: 'Favicon (ikona v prehliadači)' },
      { slot: 'logo-nav', label: 'Logo v navigácii' },
      { slot: 'logo-footer', label: 'Logo v pätičke' },
    ],
    hero: [
      { slot: 'hero', label: 'Hlavný banner (hero)' },
      { slot: 'hero-alt', label: 'Alternatívny hero / pozadie' },
    ],
    services: [
      { slot: 'service-house', label: 'Karta — Domy na kľúč' },
      { slot: 'service-reconstruction', label: 'Karta — Rekonštrukcie' },
      { slot: 'service-facade', label: 'Karta — Fasády a interiéry' },
      { slot: 'service-featured', label: 'Veľká fotka vpravo' },
    ],
    team: [
      { slot: 'team-1', label: 'Člen tímu 1' },
      { slot: 'team-2', label: 'Člen tímu 2' },
      { slot: 'team-3', label: 'Člen tímu 3' },
    ],
  }

  function projectsMap() {
    return global.PROJECTS || {}
  }

  /** Build replaceable slots for one project (cover + every gallery/detail photo). */
  function worksSlotsForProject(projectId) {
    const p = projectsMap()[projectId]
    if (!p) return []
    const slots = []
    if (p.thumbnail) {
      slots.push({
        slot: `${projectId}/thumbnail`,
        label: 'Náhľad na homepage (thumbnail)',
        fallback: p.thumbnail,
        kind: 'thumbnail',
        index: 0,
      })
    }
    ;(p.images || []).forEach((path, index) => {
      slots.push({
        slot: `${projectId}/images/${index}`,
        label: `Detailná galéria — foto ${index + 1}`,
        fallback: path,
        kind: 'images',
        index,
      })
    })
    ;(p.gallery || []).forEach((path, index) => {
      slots.push({
        slot: `${projectId}/gallery/${index}`,
        label: `Miniatury na karte — ${index + 1}`,
        fallback: path,
        kind: 'gallery',
        index,
      })
    })
    return slots
  }

  function listProjectIds() {
    return Object.keys(projectsMap())
  }

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

  function uuidv4() {
    const c = global.crypto
    if (c && typeof c.randomUUID === 'function') {
      try {
        return c.randomUUID()
      } catch (_) {
        /* fall through */
      }
    }
    if (c && typeof c.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      c.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0
      const v = ch === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function formatError(err) {
    if (!err) return 'Neznáma chyba'
    if (typeof err === 'string') return err
    const parts = [err.message, err.error, err.statusCode || err.status, err.code, err.details, err.hint]
      .filter(Boolean)
    return [...new Set(parts.map(String))].join(' · ')
  }

  function isStorageObjectPath(path) {
    const p = String(path || '')
    if (!p || /^https?:\/\//i.test(p)) return false
    if (p.startsWith('images/') || p.startsWith('/images/')) return false
    return true
  }

  function publicUrl(storagePath) {
    if (!storagePath) return ''
    if (/^https?:\/\//i.test(storagePath)) return storagePath
    if (String(storagePath).startsWith('images/')) return storagePath
    if (String(storagePath).startsWith('/')) return storagePath.slice(1)
    if (!db) return storagePath
    const { data } = db.storage.from(SITE_BUCKET).getPublicUrl(storagePath)
    return data?.publicUrl || ''
  }

  function mapImageRow(row) {
    return {
      id: row.id,
      category: row.category,
      slot: row.slot || null,
      storagePath: row.storage_path,
      alt: row.alt_text || '',
      sortOrder: row.sort_order ?? 0,
      workTypes: Array.isArray(row.work_types) ? row.work_types : [],
      projectId: row.project_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      url: publicUrl(row.storage_path),
      isLocalSeed: !isStorageObjectPath(row.storage_path),
    }
  }

  async function fetchSiteImages({ category } = {}) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    let query = db.from('site_images').select('*')
    if (category && category !== 'all') query = query.eq('category', category)
    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapImageRow)
  }

  const MAX_SOURCE_BYTES = 40 * 1024 * 1024
  const MAX_EDGE = 1800

  function normalizeFile(file) {
    let type = (file.type || '').toLowerCase()
    if (!type || type === 'application/octet-stream') {
      const name = (file.name || '').toLowerCase()
      if (name.endsWith('.jpg') || name.endsWith('.jpeg')) type = 'image/jpeg'
      else if (name.endsWith('.png')) type = 'image/png'
      else if (name.endsWith('.webp')) type = 'image/webp'
      else if (name.endsWith('.heic')) type = 'image/heic'
      else if (name.endsWith('.heif')) type = 'image/heif'
    }
    if (type === 'image/jpg' || type === 'image/pjpeg') type = 'image/jpeg'
    if (type === file.type) return file
    return new File([file], file.name, { type, lastModified: file.lastModified })
  }

  /**
   * Check the picked files. With `resize: true` (photos) any image type is accepted up to
   * 40 MB because it is shrunk in the browser before upload (phone photos are often 5-10 MB
   * or HEIC). Without it (logos) the strict JPEG/PNG/WebP + 5 MB rule applies.
   */
  function validateFiles(fileList, { max = 10, resize = true } = {}) {
    const files = Array.from(fileList || []).map(normalizeFile)
    if (!files.length) return { ok: false, error: 'Vyberte aspoň jednu fotografiu.' }
    if (files.length > max) return { ok: false, error: `Naraz najviac ${max} súborov.` }
    for (const file of files) {
      if (resize) {
        if (!/^image\//.test(file.type)) {
          return { ok: false, error: `${file.name} nie je obrázok.` }
        }
        if (file.size > MAX_SOURCE_BYTES) {
          return { ok: false, error: `${file.name} je väčší než 40 MB.` }
        }
      } else {
        if (!ALLOWED_TYPES[file.type]) {
          return {
            ok: false,
            error: `Nepodporovaný formát: ${file.name}. Povolené: JPEG, PNG, WebP.`,
          }
        }
        if (file.size > MAX_BYTES) {
          return { ok: false, error: `${file.name} je väčší než 5 MB.` }
        }
      }
    }
    return { ok: true, files }
  }

  async function decodeImage(file) {
    if (typeof global.createImageBitmap === 'function') {
      try {
        return await global.createImageBitmap(file, { imageOrientation: 'from-image' })
      } catch (_) {
        /* fall back to <img> */
      }
    }
    const objectUrl = URL.createObjectURL(file)
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('decode'))
        img.src = objectUrl
      })
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
    }
  }

  /** Shrink to max 1800 px and re-encode as JPEG (~200-500 KB). Returns a File ready for upload. */
  async function prepareImage(file) {
    const source = normalizeFile(file)
    let bitmap
    try {
      bitmap = await decodeImage(source)
    } catch (_) {
      // Browser cannot read it (e.g. HEIC in Chrome). Small supported files can still go as-is.
      if (ALLOWED_TYPES[source.type] && source.size <= MAX_BYTES) return source
      throw new Error(
        `${source.name}: formát sa nepodarilo načítať. Uložte fotku ako JPEG (alebo odfoťte znova) a skúste to ešte raz.`,
      )
    }
    const w = bitmap.width || bitmap.naturalWidth
    const h = bitmap.height || bitmap.naturalHeight
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    if (bitmap.close) bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84))
    if (!blob) throw new Error(`${source.name}: nepodarilo sa spracovať obrázok.`)
    if (blob.size > MAX_BYTES) throw new Error(`${source.name}: po zmenšení je stále väčší než 5 MB.`)
    const base = (source.name || 'foto').replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  }

  async function uploadImageFile(file, userId, { resize = true } = {}) {
    const normalized = resize ? await prepareImage(file) : normalizeFile(file)
    const ext = ALLOWED_TYPES[normalized.type]
    if (!ext) throw new Error(`Nepodporovaný typ: ${normalized.type || 'neznámy'}`)
    if (!userId) throw new Error('Nie ste prihlásení.')
    const path = `${userId}/${uuidv4()}.${ext}`
    const { error } = await db.storage.from(SITE_BUCKET).upload(path, normalized, {
      contentType: normalized.type,
      upsert: false,
    })
    if (error) {
      error.message = `Storage: ${formatError(error)}`
      throw error
    }
    return path
  }

  async function addSiteImage({ file, category, slot, altText, sortOrder, userId, workTypes, projectId }) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    const path = await uploadImageFile(file, userId, { resize: category !== 'brand' })
    const row = {
      category,
      slot: slot || null,
      storage_path: path,
      alt_text: (altText || '').trim() || String(file.name || '').replace(/\.[^.]+$/, ''),
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      work_types: Array.isArray(workTypes) ? workTypes : [],
      project_id: projectId || null,
    }
    const { data, error } = await db.from('site_images').insert(row).select('*').single()
    if (error) {
      await db.storage.from(SITE_BUCKET).remove([path])
      error.message = `DB site_images: ${formatError(error)}`
      throw error
    }
    return mapImageRow(data)
  }

  async function replaceSiteImage(row, file, userId, { altText, slot, category } = {}) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    if (!row?.id) throw new Error('Chýba id fotografie.')
    const newPath = await uploadImageFile(file, userId, { resize: (category || row.category) !== 'brand' })
    const patch = { storage_path: newPath }
    if (altText != null && String(altText).trim()) patch.alt_text = String(altText).trim()
    if (slot !== undefined) patch.slot = slot || null
    if (category) patch.category = category
    const { error } = await db.from('site_images').update(patch).eq('id', row.id)
    if (error) {
      await db.storage.from(SITE_BUCKET).remove([newPath])
      error.message = `DB update: ${formatError(error)}`
      throw error
    }
    const oldPath = row.storagePath || row.storage_path
    if (oldPath && isStorageObjectPath(oldPath) && oldPath !== newPath) {
      await db.storage.from(SITE_BUCKET).remove([oldPath])
    }
    return newPath
  }

  async function updateSiteImageMeta(id, { altText, slot, sortOrder, category, workTypes, projectId } = {}) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    const patch = {}
    if (Array.isArray(workTypes)) patch.work_types = workTypes
    if (projectId !== undefined) patch.project_id = projectId || null
    if (altText != null) patch.alt_text = String(altText).trim()
    if (slot !== undefined) patch.slot = slot || null
    if (sortOrder != null && Number.isFinite(Number(sortOrder))) patch.sort_order = Number(sortOrder)
    if (category) patch.category = category
    if (!Object.keys(patch).length) return
    const { error } = await db.from('site_images').update(patch).eq('id', id)
    if (error) {
      error.message = `DB update: ${formatError(error)}`
      throw error
    }
  }

  async function reorderSiteImages(orderedIds) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    const updates = orderedIds.map((id, index) =>
      db.from('site_images').update({ sort_order: index + 1 }).eq('id', id),
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed?.error) throw failed.error
  }

  async function deleteSiteImage(row) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    const id = row.id
    const path = row.storagePath || row.storage_path
    if (id) {
      const { error } = await db.from('site_images').delete().eq('id', id)
      if (error) {
        error.message = `DB delete: ${formatError(error)}`
        throw error
      }
    }
    if (path && isStorageObjectPath(path)) {
      await db.storage.from(SITE_BUCKET).remove([path])
    }
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
    // No .select(): visitors may INSERT but never read leads back (RLS), and asking for the
    // inserted row would make PostgREST fail with "permission denied".
    const { error } = await db.from('leads').insert(row)
    if (error) {
      error.message = `Uloženie dopytu: ${formatError(error)}`
      throw error
    }
    return { ok: true }
  }

  async function fetchLeads({ status } = {}) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    let query = db.from('leads').select('*').order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
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

  const REVIEW_STATUS_LABELS = {
    pending: 'Čaká na schválenie',
    accepted: 'Prijatá',
  }

  function normalizeReviewPayload(data) {
    const authorName = String(data.author_name || data.name || '').trim()
    const rating = Number(data.rating)
    const body = String(data.body || data.text || '').trim()
    if (authorName.length < 2) {
      throw new Error('Meno musí mať aspoň 2 znaky.')
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Vyberte hodnotenie od 1 do 5 hviezdičiek.')
    }
    if (body.length < 10) {
      throw new Error('Text recenzie musí mať aspoň 10 znakov.')
    }
    return {
      author_name: authorName.slice(0, 80),
      rating,
      body: body.slice(0, 1500),
      status: 'pending',
    }
  }

  /** Public: only accepted reviews (RLS). */
  async function fetchAcceptedReviews() {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    const { data, error } = await db
      .from('reviews')
      .select('id, author_name, rating, body, status, created_at')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  /** Admin: all reviews, optional status filter. */
  async function fetchReviews({ status } = {}) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    let query = db
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async function submitReview(data) {
    if (!db) {
      throw new Error(
        'Recenzie ešte nie sú napojené. Skontrolujte js/supabase-config.js a spustite SQL (SUPABASE.md).',
      )
    }
    const row = normalizeReviewPayload(data)
    // No .select(): a pending review is invisible to visitors (RLS), so reading it back fails.
    const { error } = await db.from('reviews').insert(row)
    if (error) {
      error.message = `Uloženie recenzie: ${formatError(error)}`
      throw error
    }
    return { ok: true }
  }

  async function acceptReview(id) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    if (!id) throw new Error('Chýba id recenzie.')
    const { error } = await db.from('reviews').update({ status: 'accepted' }).eq('id', id)
    if (error) throw error
  }

  async function deleteReview(id) {
    if (!db) throw new Error('Supabase nie je nakonfigurovaný.')
    if (!id) throw new Error('Chýba id recenzie.')
    const { error } = await db.from('reviews').delete().eq('id', id)
    if (error) throw error
  }

  /** True only for the account listed in public.admin_users (checked server-side by RLS as well). */
  async function isAdmin() {
    if (!db) return false
    const { data, error } = await db.rpc('is_admin')
    if (error) return false
    return data === true
  }

  function starsHtml(rating) {
    const n = Math.max(1, Math.min(5, Number(rating) || 0))
    let html = ''
    for (let i = 1; i <= 5; i += 1) {
      html += i <= n ? '<span class="star">★</span>' : '<span class="star star--empty">☆</span>'
    }
    return html
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

  global.UkstavReviews = {
    db,
    configured,
    STATUS_LABELS: REVIEW_STATUS_LABELS,
    formatError,
    starsHtml,
    fetchAcceptedReviews,
    fetchReviews,
    submitReview,
    acceptReview,
    deleteReview,
  }

  global.UkstavMedia = {
    db,
    isAdmin,
    prepareImage,
    configured,
    SITE_BUCKET,
    MAX_BYTES,
    ALLOWED_TYPES,
    CATEGORIES,
    FIXED_SLOTS,
    worksSlotsForProject,
    listProjectIds,
    formatError,
    publicUrl,
    isStorageObjectPath,
    fetchSiteImages,
    validateFiles,
    addSiteImage,
    replaceSiteImage,
    updateSiteImageMeta,
    reorderSiteImages,
    deleteSiteImage,
  }
})(window)
