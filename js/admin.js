;(async function () {
  const $ = (sel, root = document) => root.querySelector(sel)
  const msgEl = $('#admin-msg')
  const loginView = $('#login-view')
  const appView = $('#app-view')
  const loginForm = $('#login-form')
  const leadsList = $('#leads-list')
  const userLine = $('#user-line')
  const emptyEl = $('#list-empty')
  const cfgMissing = $('#config-missing')
  const listCount = $('#list-count')
  const filterStatus = $('#filter-status')

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

  const api = window.UkstavLeads
  if (!api?.configured) {
    loginView?.classList.add('hidden')
    appView?.classList.add('hidden')
    cfgMissing?.classList.remove('hidden')
    return
  }

  cfgMissing?.classList.add('hidden')
  const { db } = api

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

  function statusOptions(current) {
    return Object.entries(api.STATUS_LABELS)
      .map(
        ([value, label]) =>
          `<option value="${value}"${value === current ? ' selected' : ''}>${escapeHtml(label)}</option>`,
      )
      .join('')
  }

  async function refreshList() {
    try {
      const status = filterStatus?.value || 'all'
      const rows = await api.fetchLeads({ status })
      leadsList.replaceChildren()
      if (listCount) {
        listCount.textContent = rows.length ? `${rows.length} dopytov` : ''
      }
      if (!rows.length) {
        emptyEl?.classList.remove('hidden')
        return
      }
      emptyEl?.classList.add('hidden')

      for (const row of rows) {
        const card = document.createElement('article')
        card.className = 'lead-card'
        card.dataset.id = row.id
        const sourceLabel = api.SOURCE_LABELS[row.source] || row.source || '—'
        const phoneHref = String(row.phone || '').replace(/\s/g, '')
        card.innerHTML = `
          <header class="lead-card__head">
            <div>
              <h3 class="lead-card__name">${escapeHtml(row.name)}</h3>
              <p class="lead-card__meta">${escapeHtml(formatWhen(row.created_at))} · ${escapeHtml(sourceLabel)}</p>
            </div>
            <span class="lead-card__badge lead-card__badge--${escapeAttr(row.status)}">${escapeHtml(api.STATUS_LABELS[row.status] || row.status)}</span>
          </header>
          <div class="lead-card__body">
            <p><a href="tel:${escapeAttr(phoneHref)}">${escapeHtml(row.phone)}</a></p>
            ${row.description ? `<p class="lead-card__desc">${escapeHtml(row.description)}</p>` : ''}
            ${row.callback_time ? `<p class="lead-card__callback">Preferovaný čas: <strong>${escapeHtml(row.callback_time)}</strong></p>` : ''}
          </div>
          <div class="lead-card__actions">
            <label class="lead-edit">
              Stav
              <select class="lead-status" data-id="${escapeAttr(row.id)}">${statusOptions(row.status)}</select>
            </label>
            <label class="lead-edit">
              Poznámka
              <textarea class="lead-notes" data-id="${escapeAttr(row.id)}" rows="2" maxlength="2000" placeholder="Interná poznámka…">${escapeHtml(row.notes || '')}</textarea>
            </label>
            <div class="lead-card__buttons">
              <button type="button" class="btn btn-outline" data-save="${escapeAttr(row.id)}">Uložiť</button>
              <button type="button" class="btn btn-danger" data-delete="${escapeAttr(row.id)}">Zmazať</button>
            </div>
          </div>
        `
        leadsList.appendChild(card)
      }
    } catch (err) {
      console.error(err)
      message(`Nepodarilo sa načítať dopyty: ${api.formatError(err)}`, 'error')
      if (listCount) listCount.textContent = ''
    }
  }

  async function syncSession() {
    const { data } = await db.auth.getSession()
    const session = data.session
    if (session?.user) {
      loginView.classList.add('hidden')
      appView.classList.remove('hidden')
      userLine.innerHTML = `Prihlásený: <strong>${escapeHtml(session.user.email || session.user.id)}</strong>`
      await refreshList()
    } else {
      appView.classList.add('hidden')
      loginView.classList.remove('hidden')
      leadsList.replaceChildren()
      if (listCount) listCount.textContent = ''
    }
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
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
      console.error(err)
      message(err.message || 'Prihlásenie sa nepodarilo.', 'error')
    } finally {
      btn.disabled = false
    }
  })

  $('#logout')?.addEventListener('click', async () => {
    await db.auth.signOut()
    message('Boli ste odhlásení.', 'info')
    await syncSession()
  })

  $('#refresh')?.addEventListener('click', async () => {
    clearMessage()
    await refreshList()
    message('Zoznam obnovený.', 'ok')
  })

  filterStatus?.addEventListener('change', async () => {
    clearMessage()
    await refreshList()
  })

  leadsList?.addEventListener('click', async (e) => {
    const saveBtn = e.target.closest('button[data-save]')
    if (saveBtn) {
      const id = saveBtn.getAttribute('data-save')
      const card = saveBtn.closest('.lead-card')
      const status = card?.querySelector('.lead-status')?.value
      const notes = card?.querySelector('.lead-notes')?.value || ''
      saveBtn.disabled = true
      try {
        await api.updateLead(id, { status, notes })
        message('Dopyt uložený.', 'ok')
        await refreshList()
      } catch (err) {
        console.error(err)
        message(`Uloženie zlyhalo: ${api.formatError(err)}`, 'error')
        saveBtn.disabled = false
      }
      return
    }

    const delBtn = e.target.closest('button[data-delete]')
    if (delBtn) {
      const id = delBtn.getAttribute('data-delete')
      if (!confirm('Naozaj zmazať tento dopyt?')) return
      delBtn.disabled = true
      try {
        await api.deleteLead(id)
        message('Dopyt zmazaný.', 'ok')
        await refreshList()
      } catch (err) {
        console.error(err)
        message(`Mazanie zlyhalo: ${api.formatError(err)}`, 'error')
        delBtn.disabled = false
      }
    }
  })

  db.auth.onAuthStateChange(() => {
    syncSession()
  })

  await syncSession()
})()
