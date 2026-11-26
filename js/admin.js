;(async function () {
  // Never run inside someone else's page (clickjacking protection).
  if (window.top !== window.self) {
    document.documentElement.innerHTML = ''
    return
  }

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
  const galleryIntro = $('#gallery-intro')
  const galleryToolbar = $('#gallery-toolbar')
  const galleryChips = $('#gallery-filter-chips')
  const galleryFilterProject = $('#gallery-filter-project')
  const galleryFilterVisibility = $('#gallery-filter-visibility')
  const galleryFilterQ = $('#gallery-filter-q')
  const photosMore = $('#photos-more')
  const leadsList = $('#leads-list')
  const leadsEmpty = $('#leads-empty')
  const leadsCount = $('#leads-count')
  const filterStatus = $('#filter-status')
  const reviewsList = $('#reviews-list')
  const reviewsEmpty = $('#reviews-empty')
  const reviewsCount = $('#reviews-count')
  const filterReviewStatus = $('#filter-review-status')
  const galleryFields = $('#gallery-fields')
  const workTypeChecks = $('#work-type-checks')
  const photoProject = $('#photo-project')
  const uploadTitle = $('#upload-title')
  const uploadHint = $('#upload-hint')
  const photosInput = $('#photos')
  const logoutBtn = $('#logout')

  let activeCategory = 'gallery'
  const GALLERY_PAGE = 24
  const galleryView = { type: 'all', project: '', visibility: 'all', q: '', visible: GALLERY_PAGE }
  let cachedPhotos = []
  let dbRows = []

  const demoMode = new URLSearchParams(window.location.search).get('demo') === '1'
  const media = window.UkstavMedia || {}
  const leadsApi = window.UkstavLeads || {}
  const reviewsApi = window.UkstavReviews || {}

  const FIXED_SLOTS = media.FIXED_SLOTS || {}

  const LOCAL_SEED = {
    brand: [
      { id: 'demo-fav', category: 'brand', slot: 'favicon', url: 'images/ukstav_logo_2.png', alt: 'Favicon', isLocalSeed: true },
      { id: 'demo-nav', category: 'brand', slot: 'logo-nav', url: 'images/ukstav_logo_2.png', alt: 'Logo nav', isLocalSeed: true },
      { id: 'demo-foot', category: 'brand', slot: 'logo-footer', url: 'images/ukstav_logo_2.png', alt: 'Logo footer', isLocalSeed: true },
    ],
    hero: [
      { id: 'demo-hero', category: 'hero', slot: 'hero', url: 'images/hero-house.jpg', alt: 'Hero', isLocalSeed: true },
      { id: 'demo-hero-light', category: 'hero', slot: 'hero-light', url: 'images/hero-light.jpg', alt: 'Hero (svetlá téma)', isLocalSeed: true },
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

  const WORK_TYPE_LIST = typeof WORK_TYPES !== 'undefined' ? WORK_TYPES : []

  function typeCheckboxes(selected, namePrefix) {
    return WORK_TYPE_LIST.map(
      (t) => `
        <label class="chip">
          <input type="checkbox" data-work-type value="${escapeAttr(t.key)}" ${
            (selected || []).includes(t.key) ? 'checked' : ''
          } ${namePrefix === 'card' && demoMode ? 'disabled' : ''} />
          <span>${escapeHtml(t.label)}</span>
        </label>`,
    ).join('')
  }

  function projectOptions(selected) {
    const ids = Object.keys(window.PROJECTS || {})
    return (
      '<option value="">— bez projektu —</option>' +
      ids
        .map(
          (id) =>
            `<option value="${escapeAttr(id)}"${id === selected ? ' selected' : ''}>${escapeHtml(
              PROJECTS[id].title,
            )}</option>`,
        )
        .join('')
    )
  }

  function checkedTypes(root) {
    return $$('input[data-work-type]:checked', root).map((el) => el.value)
  }

  if (!demoMode && !media.configured) {
    loginView?.classList.add('hidden')
    appView?.classList.add('hidden')
    cfgMissing?.classList.remove('hidden')
    return
  }

  cfgMissing?.classList.add('hidden')
  const db = media.db

  function refreshSlotSelect() {
    const isGallery = activeCategory === 'gallery'
    galleryFields?.classList.toggle('hidden', !isGallery)
    galleryIntro?.classList.toggle('hidden', !isGallery)
    galleryToolbar?.classList.toggle('hidden', !isGallery)
    if (isGallery) {
      renderGalleryChips()
      if (galleryFilterProject && galleryFilterProject.options.length <= 1) {
        galleryFilterProject.innerHTML =
          '<option value="">— všetky projekty —</option><option value="__none">— bez projektu —</option>' +
          Object.keys(window.PROJECTS || {})
            .map((id) => `<option value="${escapeAttr(id)}">${escapeHtml(PROJECTS[id].title)}</option>`)
            .join('')
      }
      if (workTypeChecks && !workTypeChecks.children.length) {
        workTypeChecks.innerHTML = typeCheckboxes([], 'form')
      }
      if (photoProject && photoProject.options.length <= 1) {
        photoProject.innerHTML = projectOptions('')
      }
    }
    if (uploadTitle) {
      uploadTitle.textContent = isGallery ? 'Pridať nové fotografie' : 'Pridať / nahradiť fotografiu'
    }
    if (uploadHint) {
      uploadHint.textContent = isGallery
        ? 'Veľké fotky z telefónu sa pred nahraním automaticky zmenšia. Nové fotky sa zobrazia na začiatku galérie a na stránke zvoleného projektu. Fotka bez typu sa ukáže len vo filtri „Všetko“.'
        : 'Nahranie do rovnakého miesta nahradí existujúcu fotku.'
    }
    if (photosInput) {
      // Logos keep their original format (transparency); everything else is resized in the browser.
      photosInput.accept =
        activeCategory === 'brand' ? 'image/jpeg,image/png,image/webp' : 'image/*'
      photosInput.multiple = isGallery
    }

    if (!slotSelect) return
    const fixed = FIXED_SLOTS[activeCategory]
    if (fixed) {
      slotWrap?.classList.remove('hidden')
      uploadForm?.classList.remove('hidden')
      slotSelect.innerHTML = fixed
        .map((s) => `<option value="${escapeAttr(s.slot)}">${escapeHtml(s.label)}</option>`)
        .join('')
      slotSelect.required = true
    } else if (isGallery) {
      slotWrap?.classList.add('hidden')
      uploadForm?.classList.remove('hidden')
      slotSelect.innerHTML = ''
      slotSelect.required = false
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

  // ---------- Gallery manager (Realizácie a galéria) ----------
  function galleryTypeLabel(key) {
    const t = WORK_TYPE_LIST.find((x) => x.key === key)
    return t ? t.label : key
  }

  function resetGalleryFilters() {
    galleryView.type = 'all'
    galleryView.project = ''
    galleryView.visibility = 'all'
    galleryView.q = ''
    galleryView.visible = GALLERY_PAGE
    if (galleryFilterProject) galleryFilterProject.value = ''
    if (galleryFilterVisibility) galleryFilterVisibility.value = 'all'
    if (galleryFilterQ) galleryFilterQ.value = ''
  }

  function renderGalleryChips() {
    if (!galleryChips) return
    const rows = activeCategory === 'gallery' ? cachedPhotos : []
    const items = [
      { key: 'all', label: 'Všetko', n: rows.length },
      ...WORK_TYPE_LIST.map((t) => ({
        key: t.key,
        label: t.label,
        n: rows.filter((r) => (r.workTypes || []).includes(t.key)).length,
      })),
      { key: 'none', label: 'Bez typu', n: rows.filter((r) => !(r.workTypes || []).length).length },
    ]
    galleryChips.innerHTML = items
      .map(
        (it) => `<button type="button" class="chip chip--btn${galleryView.type === it.key ? ' is-active' : ''}"
          data-gtype="${escapeAttr(it.key)}" aria-pressed="${galleryView.type === it.key}">
          ${escapeHtml(it.label)} <span class="chip__n">${it.n}</span></button>`,
      )
      .join('')
  }

  function filteredGallery() {
    const q = galleryView.q.trim().toLowerCase()
    return cachedPhotos.filter((r) => {
      const types = r.workTypes || []
      if (galleryView.type === 'none') {
        if (types.length) return false
      } else if (galleryView.type !== 'all' && !types.includes(galleryView.type)) {
        return false
      }
      if (galleryView.project === '__none') {
        if (r.projectId) return false
      } else if (galleryView.project && r.projectId !== galleryView.project) {
        return false
      }
      if (galleryView.visibility === 'visible' && !r.isVisible) return false
      if (galleryView.visibility === 'hidden' && r.isVisible) return false
      if (q) {
        const proj = r.projectId && window.PROJECTS?.[r.projectId] ? PROJECTS[r.projectId].title : ''
        if (!`${r.alt || ''} ${proj}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }

  function galleryLabel(row) {
    const proj = row.projectId && window.PROJECTS?.[row.projectId] ? PROJECTS[row.projectId].title : 'bez projektu'
    return `${row.isLocalSeed ? 'pôvodná fotka' : 'nahraná fotka'} · ${proj}${row.isVisible ? '' : ' · SKRYTÁ'}`
  }

  function renderPhotoCards(rows) {
    cachedPhotos = rows
    const isGallery = activeCategory === 'gallery'
    if (isGallery) renderGalleryChips()
    const list = isGallery ? filteredGallery() : rows
    const shown = isGallery ? list.slice(0, galleryView.visible) : list
    photosList.replaceChildren()
    if (photosCount) {
      photosCount.textContent = !rows.length
        ? ''
        : isGallery && list.length !== rows.length
          ? `${list.length} z ${rows.length} fotiek`
          : `${rows.length} fotiek`
    }
    if (photosMore) {
      const left = list.length - shown.length
      photosMore.classList.toggle('hidden', left <= 0)
      photosMore.textContent = `Zobraziť ďalšie (${left})`
    }
    if (!list.length) {
      if (photosEmpty) {
        photosEmpty.textContent =
          isGallery && rows.length
            ? 'Žiadna fotka nezodpovedá filtru.'
            : 'V tejto sekcii zatiaľ nie sú nahraté fotky.'
        photosEmpty.classList.remove('hidden')
      }
      return
    }
    photosEmpty?.classList.add('hidden')

    shown.forEach((row, index) => {
      const card = document.createElement('article')
      card.className = 'photo-card' + (isGallery && !row.isVisible ? ' is-hidden' : '')
      card.dataset.id = row.id || row.slot || `row-${index}`
      if (row.slot) card.dataset.slot = row.slot
      const badge = row.isLocalSeed || row._virtual ? ' · lokálna / web' : ''
      const galleryExtras = isGallery
        ? `<fieldset class="chips chips--small">
             <legend>Typ prác</legend>
             <div class="chips__list" data-card-types>${typeCheckboxes(row.workTypes, 'card')}</div>
           </fieldset>
           <div class="photo-card__row">
             <label class="lead-edit">
               Projekt
               <select class="photo-project" ${demoMode ? 'disabled' : ''}>${projectOptions(row.projectId || '')}</select>
             </label>
             <label class="chip">
               <input type="checkbox" class="photo-visible" ${row.isVisible ? 'checked' : ''} ${demoMode ? 'disabled' : ''} />
               <span>Zobrazovať na webe</span>
             </label>
           </div>`
        : ''
      const moves = isGallery
        ? `<button type="button" class="btn btn-outline" data-move="top" title="Presunúť na začiatok galérie" ${demoMode ? 'disabled' : ''}>⤒ Na začiatok</button>
           <button type="button" class="btn btn-outline" data-move="up" title="Posunúť vyššie" ${index === 0 ? 'disabled' : ''}>↑</button>
           <button type="button" class="btn btn-outline" data-move="down" title="Posunúť nižšie" ${index === list.length - 1 ? 'disabled' : ''}>↓</button>`
        : ''
      card.innerHTML = `
        <div class="photo-card__media">
          <img src="${escapeAttr(isGallery && row.isLocalSeed && typeof workThumb === 'function' ? workThumb(row.storagePath || row.url) : row.url)}" alt="${escapeAttr(row.alt || '')}" loading="lazy" />
        </div>
        <div class="photo-card__body">
          <p class="photo-card__slot">${escapeHtml(isGallery ? galleryLabel(row) : slotLabel(row) + badge)}</p>
          <label class="lead-edit">
            Popis
            <input type="text" class="photo-alt" value="${escapeAttr(row.alt || '')}" maxlength="160" ${demoMode ? 'readonly' : ''} />
          </label>
          ${galleryExtras}
          <div class="photo-card__buttons">
            ${moves}
            <label class="btn btn-outline photo-replace">
              Nahradiť fotku
              <input type="file" accept="image/*" hidden data-replace ${demoMode ? 'disabled' : ''} />
            </label>
            ${
              row._virtual
                ? ''
                : `<button type="button" class="btn btn-primary" data-save ${demoMode ? 'disabled' : ''}>Uložiť</button>
                   <button type="button" class="btn btn-danger" data-delete ${demoMode ? 'disabled' : ''}>Zmazať</button>`
            }
          </div>
        </div>
      `
      photosList.appendChild(card)
    })
  }

  async function refreshPhotos() {
    try {
      if (demoMode) {
        renderPhotoCards(LOCAL_SEED[activeCategory] || [])
        return
      }
      dbRows = await media.fetchSiteImages({ category: activeCategory })
      renderPhotoCards(dbRows)
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

  function reviewStars(rating) {
    if (reviewsApi.starsHtml) return reviewsApi.starsHtml(rating)
    const n = Math.max(0, Math.min(5, Number(rating) || 0))
    return '★'.repeat(n) + '☆'.repeat(5 - n)
  }

  async function refreshReviews() {
    if (!reviewsList || demoMode) {
      if (reviewsEmpty) {
        reviewsEmpty.textContent = demoMode
          ? 'V ukážke (?demo=1) sa recenzie nenačítavajú.'
          : reviewsEmpty.textContent
        reviewsEmpty.classList.remove('hidden')
      }
      reviewsList?.replaceChildren()
      if (reviewsCount) reviewsCount.textContent = ''
      return
    }
    try {
      const status = filterReviewStatus?.value || 'all'
      const rows = await reviewsApi.fetchReviews({ status })
      reviewsList.replaceChildren()
      if (reviewsCount) reviewsCount.textContent = rows.length ? `${rows.length}` : ''
      if (!rows.length) {
        reviewsEmpty?.classList.remove('hidden')
        return
      }
      reviewsEmpty?.classList.add('hidden')
      for (const row of rows) {
        const card = document.createElement('article')
        card.className = 'lead-card review-admin-card'
        const badgeClass =
          row.status === 'accepted' ? 'lead-card__badge--done' : 'lead-card__badge--new'
        const statusLabel = reviewsApi.STATUS_LABELS?.[row.status] || row.status
        card.innerHTML = `
          <header class="lead-card__head">
            <div>
              <h3 class="lead-card__name">${escapeHtml(row.author_name)}</h3>
              <p class="lead-card__meta">${escapeHtml(formatWhen(row.created_at))} · <span class="review-admin-stars" aria-label="${Number(row.rating)} z 5">${reviewStars(row.rating)}</span></p>
            </div>
            <span class="lead-card__badge ${badgeClass}">${escapeHtml(statusLabel)}</span>
          </header>
          <div class="lead-card__body">
            <p class="lead-card__desc">${escapeHtml(row.body)}</p>
          </div>
          <div class="lead-card__actions">
            <div class="lead-card__buttons">
              ${
                row.status === 'pending'
                  ? `<button type="button" class="btn btn-primary" data-review-accept="${escapeAttr(row.id)}">Prijať</button>`
                  : ''
              }
              <button type="button" class="btn btn-danger" data-review-delete="${escapeAttr(row.id)}">Zmazať</button>
            </div>
          </div>
        `
        reviewsList.appendChild(card)
      }
    } catch (err) {
      message(`Recenzie: ${reviewsApi.formatError?.(err) || err.message}`, 'error')
    }
  }

  /** Digits-only international number for wa.me (07xx / 09xx → Slovak +421). */
  function waDigits(phone) {
    let d = String(phone || '').replace(/[^\d+]/g, '')
    if (d.startsWith('+')) d = d.slice(1)
    else if (d.startsWith('00')) d = d.slice(2)
    else if (d.startsWith('0')) d = '421' + d.slice(1)
    return /^\d{9,15}$/.test(d) ? d : ''
  }

  /** Small delivery status under a lead: did the automatic WhatsApp notification go out? */
  function notifyLine(row) {
    if (row.notified_at) {
      const via = String(row.notify_channel || 'whatsapp')
        .split(',')
        .map((c) => (c === 'telegram' ? 'Telegram' : 'WhatsApp'))
        .join(' + ')
      return `<p class="lead-card__notify lead-card__notify--ok">✓ Odoslané na ${escapeHtml(via)}</p>`
    }
    if (row.notify_error === 'not_configured') {
      return '<p class="lead-card__notify lead-card__notify--warn">⚠ Automatické odoslanie na WhatsApp ešte nie je nastavené (pozri SUPABASE.md)</p>'
    }
    if (row.notify_error === 'rate_limited') {
      return '<p class="lead-card__notify lead-card__notify--warn">⚠ Príliš veľa dopytov za hodinu — upozornenie sa neodoslalo, dopyt je uložený tu</p>'
    }
    if (row.notify_error) {
      return `<p class="lead-card__notify lead-card__notify--warn">⚠ Odoslanie zlyhalo: ${escapeHtml(String(row.notify_error).slice(0, 200))}</p>`
    }
    return ''
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
            <p><a href="tel:${escapeAttr(phoneHref)}">${escapeHtml(row.phone)}</a>${
              waDigits(row.phone)
                ? ` · <a href="https://wa.me/${escapeAttr(waDigits(row.phone))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`
                : ''
            }</p>
            ${row.description ? `<p class="lead-card__desc">${escapeHtml(row.description)}</p>` : ''}
            ${notifyLine(row)}
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
      await refreshReviews()
      return
    }

    const { data } = await db.auth.getSession()
    const session = data.session
    if (session?.user && !(await media.isAdmin())) {
      // Signed in, but not the administrator → no access (RLS blocks every action anyway).
      await db.auth.signOut()
      message('Tento účet nemá oprávnenie správcu.', 'error')
      appView.classList.add('hidden')
      loginView.classList.remove('hidden')
      return
    }
    if (session?.user) {
      loginView.classList.add('hidden')
      appView.classList.remove('hidden')
      userLine.innerHTML = `Prihlásený: <strong>${escapeHtml(session.user.email || session.user.id)}</strong>`
      refreshSlotSelect()
      await refreshPhotos()
      await refreshLeads()
      await refreshReviews()
    } else {
      appView.classList.add('hidden')
      loginView.classList.remove('hidden')
      photosList?.replaceChildren()
      leadsList?.replaceChildren()
      reviewsList?.replaceChildren()
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
    resetGalleryFilters()
    refreshSlotSelect()
    await refreshPhotos()
  })

  galleryChips?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-gtype]')
    if (!btn) return
    galleryView.type = btn.getAttribute('data-gtype')
    galleryView.visible = GALLERY_PAGE
    renderPhotoCards(cachedPhotos)
  })
  galleryFilterProject?.addEventListener('change', () => {
    galleryView.project = galleryFilterProject.value
    galleryView.visible = GALLERY_PAGE
    renderPhotoCards(cachedPhotos)
  })
  galleryFilterVisibility?.addEventListener('change', () => {
    galleryView.visibility = galleryFilterVisibility.value
    galleryView.visible = GALLERY_PAGE
    renderPhotoCards(cachedPhotos)
  })
  let qTimer
  galleryFilterQ?.addEventListener('input', () => {
    clearTimeout(qTimer)
    qTimer = setTimeout(() => {
      galleryView.q = galleryFilterQ.value
      galleryView.visible = GALLERY_PAGE
      renderPhotoCards(cachedPhotos)
    }, 200)
  })
  photosMore?.addEventListener('click', () => {
    galleryView.visible += GALLERY_PAGE
    renderPhotoCards(cachedPhotos)
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
      $('#panel-reviews')?.classList.toggle('hidden', panel !== 'reviews')
      if (panel === 'reviews') refreshReviews()
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
    const isGallery = activeCategory === 'gallery'
    const resize = activeCategory !== 'brand'
    const check = media.validateFiles(input.files, { max: isGallery ? 20 : 1, resize })
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
        const workTypes = isGallery ? checkedTypes(galleryFields) : []
        const projectId = isGallery ? photoProject?.value || null : null
        // New photos go to the front: smaller sort_order = earlier on the website.
        const minOrder = Math.min(0, ...cachedPhotos.map((p) => Number(p.sortOrder) || 0))
        let done = 0
        const failed = []
        for (const file of check.files) {
          message(`Nahrávam ${done + failed.length + 1}/${check.files.length}…`, 'info')
          try {
            await media.addSiteImage({
              file,
              category: activeCategory,
              slot: null,
              altText: alt,
              sortOrder: minOrder - (check.files.length - done - failed.length),
              userId: user.id,
              workTypes,
              projectId,
            })
            done += 1
          } catch (err) {
            console.error(err)
            failed.push(`${file.name}: ${media.formatError(err)}`)
          }
        }
        if (failed.length) {
          message(
            `Nahraných ${done}, zlyhalo ${failed.length}. ${failed.join(' | ')}`,
            done ? 'info' : 'error',
          )
        } else {
          message(`Hotovo — nahraných ${done} fotografií.`, 'ok')
        }
      }
      uploadForm.reset()
      resetGalleryFilters()
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
      try {
        if (dir === 'top') {
          const min = Math.min(...cachedPhotos.map((p) => Number(p.sortOrder) || 0))
          await media.updateSiteImageMeta(id, { sortOrder: min - 1 })
        } else {
          const list = filteredGallery()
          const idx = list.findIndex((p) => p.id === id)
          const other = list[dir === 'up' ? idx - 1 : idx + 1]
          if (idx < 0 || !other) return
          if (Number(row.sortOrder) === Number(other.sortOrder)) {
            // identical positions: number the whole list once, then swap
            const ids = cachedPhotos.map((p) => p.id)
            const i1 = ids.indexOf(row.id)
            const i2 = ids.indexOf(other.id)
            ;[ids[i1], ids[i2]] = [ids[i2], ids[i1]]
            await media.reorderSiteImages(ids)
          } else {
            await Promise.all([
              media.updateSiteImageMeta(row.id, { sortOrder: other.sortOrder }),
              media.updateSiteImageMeta(other.id, { sortOrder: row.sortOrder }),
            ])
          }
        }
        message('Poradie uložené.', 'ok')
        await refreshPhotos()
      } catch (err) {
        message(`Presun zlyhal: ${media.formatError(err)}`, 'error')
      }
      return
    }

    if (e.target.closest('[data-save]')) {
      const alt = card.querySelector('.photo-alt')?.value || ''
      const extra = {}
      if (card.querySelector('[data-card-types]')) {
        extra.workTypes = checkedTypes(card)
        extra.projectId = card.querySelector('.photo-project')?.value || null
        const vis = card.querySelector('.photo-visible')
        if (vis) extra.isVisible = vis.checked
      }
      try {
        await media.updateSiteImageMeta(id, { altText: alt, ...extra })
        message('Uložené.', 'ok')
        await refreshPhotos()
      } catch (err) {
        message(`Uloženie zlyhalo: ${media.formatError(err)}`, 'error')
      }
      return
    }

    if (e.target.closest('[data-delete]')) {
      const delText =
        activeCategory === 'gallery'
          ? 'Naozaj odstrániť túto fotku z galérie? Zmizne z webu aj zo stránky projektu. (Ak ju len nechcete zobrazovať, radšej zrušte „Zobrazovať na webe“.)'
          : 'Naozaj zmazať túto fotografiu? (web sa vráti k pôvodnej fotke, ak existuje)'
      if (!confirm(delText)) return
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
    const check = media.validateFiles(input.files, { max: 1, resize: row.category !== 'brand' })
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

  filterReviewStatus?.addEventListener('change', () => refreshReviews())
  $('#refresh-reviews')?.addEventListener('click', async () => {
    await refreshReviews()
    message('Zoznam recenzií obnovený.', 'ok')
  })

  reviewsList?.addEventListener('click', async (e) => {
    if (demoMode) {
      if (e.target.closest('[data-review-accept], [data-review-delete]')) {
        message('V ukážke sa zmeny neukladajú.', 'info')
      }
      return
    }
    const acceptBtn = e.target.closest('[data-review-accept]')
    if (acceptBtn) {
      const id = acceptBtn.getAttribute('data-review-accept')
      try {
        await reviewsApi.acceptReview(id)
        message('Recenzia prijatá — zobrazí sa na webe.', 'ok')
        await refreshReviews()
      } catch (err) {
        message(`Prijatie zlyhalo: ${reviewsApi.formatError?.(err) || err.message}`, 'error')
      }
      return
    }
    const delBtn = e.target.closest('[data-review-delete]')
    if (delBtn) {
      if (!confirm('Naozaj zmazať túto recenziu?')) return
      try {
        await reviewsApi.deleteReview(delBtn.getAttribute('data-review-delete'))
        message('Recenzia zmazaná.', 'ok')
        await refreshReviews()
      } catch (err) {
        message(`Mazanie zlyhalo: ${reviewsApi.formatError?.(err) || err.message}`, 'error')
      }
    }
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

  if (logoutBtn && appView) {
    new MutationObserver(() => {
      logoutBtn.classList.toggle('hidden', appView.classList.contains('hidden') || demoMode)
    }).observe(appView, { attributes: true, attributeFilter: ['class'] })
  }

  if (!demoMode && db) {
    db.auth.onAuthStateChange((event) => {
      // Avoid re-running on token refreshes; only real sign-in / sign-out changes matter.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') syncSession()
    })
  }

  refreshSlotSelect()
  await syncSession()
})()
