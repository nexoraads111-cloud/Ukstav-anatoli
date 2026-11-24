;(async function () {
  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

  const msgEl = $('#admin-msg')
  const loginView = $('#login-view')
  const appView = $('#app-view')
  const loginForm = $('#login-form')
  const userLine = $('#user-line')
  const cfgMissing = $('#config-missing')
  const photosList = $('#photos-list')
  const photosEmpty = $('#photos-empty')
  const photosCount = $('#photos-count')
  const categoryTabs = $('#category-tabs')
  const uploadForm = $('#upload-form')
  const slotSelect = $('#photo-slot')
  const slotWrap = $('#slot-wrap')
  const worksProjectWrap = $('#works-project-wrap')
  const worksProjectSelect = $('#works-project')
  const leadsList = $('#leads-list')
  const leadsEmpty = $('#leads-empty')
  const leadsCount = $('#leads-count')
  const filterStatus = $('#filter-status')

  let activeCategory = 'brand'
  let activeProjectId = 'project1'
  let cachedPhotos = []
  let dbRows = []

  const demoMode = new URLSearchParams(window.location.search).get('demo') === '1'
  const media = window.UkstavMedia || {}
  const leadsApi = window.UkstavLeads || {}

  const FIXED_SLOTS = media.FIXED_SLOTS || {}

  const LOCAL_SEED = {
    brand: [
      { id: 'demo-fav', category: 'brand', slot: 'favicon', url: 'images/ukstav_logo_2.png', alt: 'Favicon', isLocalSeed: true },
      { id: 'demo-nav', category: 'brand', slot: 'logo-nav', url: 'images/ukstav_logo_2.png', alt: 'Logo nav', isLocalSeed: true },
      { id: 'demo-foot', category: 'brand', slot: 'logo-footer', url: 'images/ukstav_logo_2.png', alt: 'Logo footer', isLocalSeed: true },
    ],
    hero: [
      { id: 'demo-hero', category: 'hero', slot: 'hero', url: 'images/hero-house.jpg', alt: 'Hero', isLocalSeed: true },
      { id: 'demo-hero-alt', category: 'hero', slot: 'hero-alt', url: 'images/hero-bg.jpg', alt: 'Hero alt', isLocalSeed: true },
    ],
    services: [
      { id: 'demo-sh', category: 'services', slot: 'service-house', url: 'images/service-house.jpg', alt: 'Domy na kľúč', isLocalSeed: true },
      { id: 'demo-sr', category: 'services', slot: 'service-reconstruction', url: 'images/service-reconstruction.jpg', alt: 'Rekonštrukcie', isLocalSeed: true },
      { id: 'demo-sf', category: 'services', slot: 'service-facade', url: 'images/service-facade.jpg', alt: 'Fasády', isLocalSeed: true },
      { id: 'demo-sfeat', category: 'services', slot: 'service-featured', url: 'images/service-featured.jpg', alt: 'Featured', isLocalSeed: true },
    ],
    team: [
      { id: 'demo-t1', category: 'team', slot: 'team-1', url: 'images/team-member-1.jpg', alt: 'Anatolij', isLocalSeed: true },
      { id: 'demo-t2', category: 'team', slot: 'team-2', url: 'images/team-member-2.jpg', alt: 'Mihajlo', isLocalSeed: true },
      { id: 'demo-t3', category: 'team', slot: 'team-3', url: 'images/team-member-3.jpg', alt: 'Oleksandr', isLocalSeed: true },
    ],
    gallery: [
      { id: 'demo-g1', category: 'gallery', slot: null, url: 'images/project1-1.jpg', alt: 'Galéria 1', isLocalSeed: true },
      { id: 'demo-g2', category: 'gallery', slot: null, url: 'images/project2-8.jpg', alt: 'Galéria 2', isLocalSeed: true },
      { id: 'demo-g3', category: 'gallery', slot: null, url: 'images/project3-1.jpg', alt: 'Galéria 3', isLocalSeed: true },
    ],
  }

  function message(text, tone = 'info') {
    if (!msgEl) return
    msgEl.textContent = text
    msgEl.className = `msg is-visible is-${tone}`
  }

  function clearMessage() {
    if (!msgEl) return
    msgEl.textContent = ''
    msgEl.className = 'msg'
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("'", '&#39;')
  }

  if (!demoMode && !media.configured) {
    loginView?.classList.add('hidden')
    appView?.classList.add('hidden')
    cfgMissing?.classList.remove('hidden')
    return
  }

  cfgMissing?.classList.add('hidden')
  const db = media.db

  function fillWorksProjectSelect() {
    if (!worksProjectSelect) return
    const ids = media.listProjectIds ? media.listProjectIds() : Object.keys(window.PROJECTS || {})
    worksProjectSelect.innerHTML = ids
      .map((id) => {
        const title = (window.PROJECTS && PROJECTS[id]?.title) || id
        return `<option value="${escapeAttr(id)}">${escapeHtml(title)}</option>`
      })
      .join('')
    if (!ids.includes(activeProjectId) && ids[0]) activeProjectId = ids[0]
    worksProjectSelect.value = activeProjectId
  }

  function refreshSlotSelect() {
    const isWorks = activeCategory === 'works'
    worksProjectWrap?.classList.toggle('hidden', !isWorks)
    if (isWorks) fillWorksProjectSelect()

    if (!slotSelect) return
    const fixed = FIXED_SLOTS[activeCategory]
    if (fixed) {
      slotWrap?.classList.remove('hidden')
      uploadForm?.classList.remove('hidden')
      slotSelect.innerHTML = fixed
        .map((s) => `<option value="${escapeAttr(s.slot)}">${escapeHtml(s.label)}</option>`)
        .join('')
      slotSelect.required = true
    } else if (activeCategory === 'gallery') {
      slotWrap?.classList.add('hidden')
      uploadForm?.classList.remove('hidden')
      slotSelect.innerHTML = ''
      slotSelect.required = false
    } else if (isWorks) {
      // Upload happens per-card replace; hide top form free-add (use inventory)
      slotWrap?.classList.add('hidden')
      uploadForm?.classList.add('hidden')
    } else {
      slotWrap?.classList.add('hidden')
      uploadForm?.classList.remove('hidden')
    }
  }

  function slotLabel(row) {
    if (!row.slot) return 'voľná fotka'
    const fixed = (FIXED_SLOTS[row.category] || []).find((s) => s.slot === row.slot)
    if (fixed) return fixed.label
    if (row._inventoryLabel) return row._inventoryLabel
    return row.slot
  }

  function renderPhotoCards(rows) {
    cachedPhotos = rows
    photosList.replaceChildren()
    if (photosCount) photosCount.textContent = rows.length ? `${rows.length} fotiek` : ''
    if (!rows.length) {
      photosEmpty?.classList.remove('hidden')
      return
    }
    photosEmpty?.classList.add('hidden')

    rows.forEach((row, index) => {
      const card = document.createElement('article')
      card.className = 'photo-card'
      card.dataset.id = row.id || row.slot || `row-${index}`
      if (row.slot) card.dataset.slot = row.slot
      const badge = row.isLocalSeed || row._virtual ? ' · lokálna / web' : ''
      const canReorder = activeCategory === 'gallery' && !row._virtual
      card.innerHTML = `
        <div class="photo-card__media">
          <img src="${escapeAttr(row.url)}" alt="${escapeAttr(row.alt || '')}" loading="lazy" />
        </div>
        <div class="photo-card__body">
          <p class="photo-card__slot">${escapeHtml(slotLabel(row))}${badge}</p>
          <label class="lead-edit">
            Popis
            <input type="text" class="photo-alt" value="${escapeAttr(row.alt || '')}" maxlength="160" ${demoMode ? 'readonly' : ''} />
          </label>
          <div class="photo-card__buttons">
            ${
              canReorder
                ? `<button type="button" class="btn btn-outline" data-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
                   <button type="button" class="btn btn-outline" data-move="down" ${index === rows.length - 1 ? 'disabled' : ''}>↓</button>`
                : ''
            }
            <label class="btn btn-outline photo-replace">
              Nahradiť
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden data-replace ${demoMode ? 'disabled' : ''} />
            </label>
            ${
              row._virtual
                ? ''
                : `<button type="button" class="btn btn-outline" data-save ${demoMode ? 'disabled' : ''}>Uložiť</button>
                   <button type="button" class="btn btn-danger" data-delete ${demoMode ? 'disabled' : ''}>Zmazať</button>`
            }
          </div>
        </div>
      `
      photosList.appendChild(card)
    })
  }

  function mergeWorksInventory(dbCategoryRows) {
    const slots = media.worksSlotsForProject
      ? media.worksSlotsForProject(activeProjectId)
      : []
    const bySlot = {}
    dbCategoryRows.forEach((r) => {
      if (r.slot) bySlot[r.slot] = r
    })
    return slots.map((s, index) => {
      const existing = bySlot[s.slot]
      if (existing) {
        return { ...existing, _inventoryLabel: s.label }
      }
      return {
        id: `virtual-${s.slot}`,
        category: 'works',
        slot: s.slot,
        url: s.fallback,
        alt: s.label,
        isLocalSeed: true,
        _virtual: true,
        _inventoryLabel: s.label,
        sortOrder: index + 1,
      }
    })
  }

  async function refreshPhotos() {
    try {
      if (demoMode) {
        if (activeCategory === 'works') {
          renderPhotoCards(mergeWorksInventory([]))
        } else {
          renderPhotoCards(LOCAL_SEED[activeCategory] || [])
        }
        return
      }
      dbRows = await media.fetchSiteImages({ category: activeCategory })
      if (activeCategory === 'works') {
        renderPhotoCards(mergeWorksInventory(dbRows))
      } else {
        renderPhotoCards(dbRows)
      }
    } catch (err) {
      console.error(err)
      message(`Nepodarilo sa načítať fotky: ${media.formatError?.(err) || err.message}`, 'error')
    }
  }

  function formatWhen(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('sk-SK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  function statusOptions(current) {
    const labels = leadsApi.STATUS_LABELS || {}
    return Object.entries(labels)
      .map(
        ([value, label]) =>
          `<option value="${value}"${value === current ? ' selected' : ''}>${escapeHtml(label)}</option>`,
      )
      .join('')
  }

  async function refreshLeads() {
    if (!leadsList || demoMode) {
      if (leadsEmpty) {
        leadsEmpty.textContent = demoMode
          ? 'V ukážke (?demo=1) sa dopyty nenačítavajú.'
          : leadsEmpty.textContent
        leadsEmpty.classList.remove('hidden')
      }
      return
    }
    try {
      const status = filterStatus?.value || 'all'
      const rows = await leadsApi.fetchLeads({ status })
      leadsList.replaceChildren()
      if (leadsCount) leadsCount.textContent = rows.length ? `${rows.length}` : ''
      if (!rows.length) {
        leadsEmpty?.classList.remove('hidden')
        return
      }
      leadsEmpty?.classList.add('hidden')
      for (const row of rows) {
        const card = document.createElement('article')
        card.className = 'lead-card'
        const phoneHref = String(row.phone || '').replace(/\s/g, '')
        const sourceLabel = leadsApi.SOURCE_LABELS?.[row.source] || row.source || '—'
        card.innerHTML = `
          <header class="lead-card__head">
            <div>
              <h3 class="lead-card__name">${escapeHtml(row.name)}</h3>
              <p class="lead-card__meta">${escapeHtml(formatWhen(row.created_at))} · ${escapeHtml(sourceLabel)}</p>
            </div>
            <span class="lead-card__badge lead-card__badge--${escapeAttr(row.status)}">${escapeHtml(leadsApi.STATUS_LABELS[row.status] || row.status)}</span>
          </header>
          <div class="lead-card__body">
            <p><a href="tel:${escapeAttr(phoneHref)}">${escapeHtml(row.phone)}</a></p>
            ${row.description ? `<p class="lead-card__desc">${escapeHtml(row.description)}</p>` : ''}
          </div>
          <div class="lead-card__actions">
            <label class="lead-edit">Stav
              <select class="lead-status">${statusOptions(row.status)}</select>
            </label>
            <label class="lead-edit">Poznámka
              <textarea class="lead-notes" rows="2" maxlength="2000">${escapeHtml(row.notes || '')}</textarea>
            </label>
            <div class="lead-card__buttons">
              <button type="button" class="btn btn-outline" data-lead-save="${escapeAttr(row.id)}">Uložiť</button>
              <button type="button" class="btn btn-danger" data-lead-delete="${escapeAttr(row.id)}">Zmazať</button>
            </div>
          </div>
        `
        leadsList.appendChild(card)
      }
    } catch (err) {
      message(`Dopyty: ${leadsApi.formatError?.(err) || err.message}`, 'error')
    }
  }

  async function syncSession() {
    if (demoMode) {
      loginView?.classList.add('hidden')
      appView?.classList.remove('hidden')
      if (userLine) {
        userLine.innerHTML =
          'Ukážka rozhrania (<code>?demo=1</code>) — bez zápisu. Ostrá správa = nový Supabase podľa <code>SUPABASE.md</code>.'
      }
      $('#logout')?.classList.add('hidden')
      refreshSlotSelect()
      await refreshPhotos()
      await refreshLeads()
      return
    }

    const { data } = await db.auth.getSession()
    const session = data.session
    if (session?.user) {
      loginView.classList.add('hidden')
      appView.classList.remove('hidden')
      userLine.innerHTML = `Prihlásený: <strong>${escapeHtml(session.user.email || session.user.id)}</strong>`
      refreshSlotSelect()
      await refreshPhotos()
      await refreshLeads()
    } else {
      appView.classList.add('hidden')
      loginView.classList.remove('hidden')
      photosList?.replaceChildren()
      leadsList?.replaceChildren()
    }
  }

  categoryTabs?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-category]')
    if (!btn) return
    activeCategory = btn.getAttribute('data-category')
    $$('[data-category]', categoryTabs).forEach((el) => {
      const on = el === btn
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    clearMessage()
    refreshSlotSelect()
    await refreshPhotos()
  })

  worksProjectSelect?.addEventListener('change', async () => {
    activeProjectId = worksProjectSelect.value
    await refreshPhotos()
  })

  $$('[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.getAttribute('data-panel')
      $$('[data-panel]').forEach((b) => {
        const on = b === btn
        b.classList.toggle('is-active', on)
        b.setAttribute('aria-selected', on ? 'true' : 'false')
      })
      $('#panel-photos')?.classList.toggle('hidden', panel !== 'photos')
      $('#panel-leads')?.classList.toggle('hidden', panel !== 'leads')
    })
  })

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (demoMode) return
    clearMessage()
    const email = $('#email').value.trim()
    const password = $('#password').value
    const btn = loginForm.querySelector('button[type="submit"]')
    btn.disabled = true
    try {
      const { error } = await db.auth.signInWithPassword({ email, password })
      if (error) throw error
      message('Prihlásenie úspešné.', 'ok')
      await syncSession()
    } catch (err) {
      message(err.message || 'Prihlásenie sa nepodarilo.', 'error')
    } finally {
      btn.disabled = false
    }
  })

  $('#logout')?.addEventListener('click', async () => {
    if (demoMode) return
    await db.auth.signOut()
    message('Boli ste odhlásení.', 'info')
    await syncSession()
  })

  $('#refresh-photos')?.addEventListener('click', async () => {
    clearMessage()
    await refreshPhotos()
    message('Zoznam fotiek obnovený.', 'ok')
  })

  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (demoMode) {
      message('V ukážke sa súbory neukladajú. Nastavte nový Supabase podľa SUPABASE.md.', 'info')
      return
    }
    clearMessage()
    const { data } = await db.auth.getSession()
    const user = data.session?.user
    if (!user) {
      message('Nie ste prihlásení.', 'error')
      return
    }
    const input = $('#photos')
    const check = media.validateFiles(input.files, { max: activeCategory === 'gallery' ? 10 : 1 })
    if (!check.ok) {
      message(check.error, 'error')
      return
    }
    const alt = ($('#photo-alt')?.value || '').trim()
    const slot = slotSelect && !slotWrap.classList.contains('hidden') ? slotSelect.value : null
    const btn = uploadForm.querySelector('button[type="submit"]')
    btn.disabled = true
    try {
      if (slot && FIXED_SLOTS[activeCategory]) {
        const existing = cachedPhotos.find((p) => p.slot === slot && !p._virtual)
        if (existing && existing.id && !String(existing.id).startsWith('virtual-')) {
          message('Nahrádzam fotografiu…', 'info')
          await media.replaceSiteImage(existing, check.files[0], user.id, {
            altText: alt || existing.alt,
          })
          message('Fotografia nahradená.', 'ok')
        } else {
          message('Nahrávam…', 'info')
          await media.addSiteImage({
            file: check.files[0],
            category: activeCategory,
            slot,
            altText: alt,
            sortOrder: cachedPhotos.length + 1,
            userId: user.id,
          })
          message('Fotografia pridaná.', 'ok')
        }
      } else {
        let done = 0
        for (const file of check.files) {
          message(`Nahrávam ${done + 1}/${check.files.length}…`, 'info')
          await media.addSiteImage({
            file,
            category: activeCategory,
            slot: null,
            altText: alt,
            sortOrder: cachedPhotos.length + done + 1,
            userId: user.id,
          })
          done += 1
        }
        message(`Hotovo — nahraných ${done} fotografií.`, 'ok')
      }
      uploadForm.reset()
      refreshSlotSelect()
      await refreshPhotos()
    } catch (err) {
      console.error(err)
      message(`Chyba pri nahrávaní: ${media.formatError(err)}`, 'error')
    } finally {
      btn.disabled = false
    }
  })

  async function upsertReplace(row, file, user, alt) {
    if (row._virtual || String(row.id).startsWith('virtual-')) {
      await media.addSiteImage({
        file,
        category: activeCategory,
        slot: row.slot,
        altText: alt || row.alt,
        sortOrder: row.sortOrder || 0,
        userId: user.id,
      })
    } else {
      await media.replaceSiteImage(row, file, user.id, { altText: alt || row.alt })
    }
  }

  photosList?.addEventListener('click', async (e) => {
    const card = e.target.closest('.photo-card')
    if (!card) return
    const id = card.dataset.id
    const row = cachedPhotos.find((p) => p.id === id || p.slot === card.dataset.slot)
    if (!row) return

    if (demoMode && e.target.closest('[data-save], [data-delete], [data-move]')) {
      message('V ukážke sa zmeny neukladajú.', 'info')
      return
    }

    const move = e.target.closest('[data-move]')
    if (move) {
      const dir = move.getAttribute('data-move')
      const ids = cachedPhotos.filter((p) => !p._virtual).map((p) => p.id)
      const idx = ids.indexOf(id)
      const swapWith = dir === 'up' ? idx - 1 : idx + 1
      if (swapWith < 0 || swapWith >= ids.length) return
      ;[ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]]
      try {
        await media.reorderSiteImages(ids)
        message('Poradie uložené.', 'ok')
        await refreshPhotos()
      } catch (err) {
        message(`Presun zlyhal: ${media.formatError(err)}`, 'error')
      }
      return
    }

    if (e.target.closest('[data-save]')) {
      const alt = card.querySelector('.photo-alt')?.value || ''
      try {
        await media.updateSiteImageMeta(id, { altText: alt })
        message('Uložené.', 'ok')
        await refreshPhotos()
      } catch (err) {
        message(`Uloženie zlyhalo: ${media.formatError(err)}`, 'error')
      }
      return
    }

    if (e.target.closest('[data-delete]')) {
      if (!confirm('Naozaj zmazať túto fotografiu? (web spadne späť na lokálny súbor, ak existuje)'))
        return
      try {
        await media.deleteSiteImage(row)
        message('Fotografia zmazaná.', 'ok')
        await refreshPhotos()
      } catch (err) {
        message(`Mazanie zlyhalo: ${media.formatError(err)}`, 'error')
      }
    }
  })

  photosList?.addEventListener('change', async (e) => {
    const input = e.target.closest('input[data-replace]')
    if (!input || !input.files?.length || demoMode) {
      if (demoMode && input?.files?.length) message('V ukážke sa súbory neukladajú.', 'info')
      return
    }
    const card = input.closest('.photo-card')
    const id = card?.dataset.id
    const row = cachedPhotos.find((p) => p.id === id || p.slot === card?.dataset.slot)
    const { data } = await db.auth.getSession()
    const user = data.session?.user
    if (!user || !row) return
    const check = media.validateFiles(input.files, { max: 1 })
    if (!check.ok) {
      message(check.error, 'error')
      input.value = ''
      return
    }
    try {
      message('Nahrádzam…', 'info')
      const alt = card.querySelector('.photo-alt')?.value
      await upsertReplace(row, check.files[0], user, alt)
      message('Fotografia nahradená.', 'ok')
      await refreshPhotos()
    } catch (err) {
      message(`Nahradenie zlyhalo: ${media.formatError(err)}`, 'error')
    } finally {
      input.value = ''
    }
  })

  filterStatus?.addEventListener('change', () => refreshLeads())
  $('#refresh-leads')?.addEventListener('click', async () => {
    await refreshLeads()
    message('Zoznam dopytov obnovený.', 'ok')
  })

  leadsList?.addEventListener('click', async (e) => {
    if (demoMode) return
    const saveBtn = e.target.closest('[data-lead-save]')
    if (saveBtn) {
      const id = saveBtn.getAttribute('data-lead-save')
      const card = saveBtn.closest('.lead-card')
      try {
        await leadsApi.updateLead(id, {
          status: card.querySelector('.lead-status')?.value,
          notes: card.querySelector('.lead-notes')?.value || '',
        })
        message('Dopyt uložený.', 'ok')
        await refreshLeads()
      } catch (err) {
        message(`Uloženie zlyhalo: ${leadsApi.formatError(err)}`, 'error')
      }
      return
    }
    const delBtn = e.target.closest('[data-lead-delete]')
    if (delBtn) {
      if (!confirm('Zmazať dopyt?')) return
      try {
        await leadsApi.deleteLead(delBtn.getAttribute('data-lead-delete'))
        message('Dopyt zmazaný.', 'ok')
        await refreshLeads()
      } catch (err) {
        message(`Mazanie zlyhalo: ${leadsApi.formatError(err)}`, 'error')
      }
    }
  })

  if (!demoMode && db) {
    db.auth.onAuthStateChange(() => {
      syncSession()
    })
  }

  refreshSlotSelect()
  await syncSession()
})()
