/**
 * Apply managed site images from Supabase onto public pages.
 * Covers brand/logos, hero (dark + light), services, team and the gallery (Realizácie).
 * The gallery photo list lives in Supabase (site_images, category "gallery") and is edited in the admin;
 * project pages show the gallery photos linked to that project.
 * Falls back to static HTML / projects.js when config missing or fetch fails.
 */
;(async function () {
  const media = window.UkstavMedia
  if (!media?.configured) return

  function bySlot(rows, slot) {
    return rows.find((r) => r.slot === slot) || null
  }

  function applyImg(el, row) {
    if (!el || !row?.url) return
    el.src = row.url
    if (row.alt) el.alt = row.alt
    el.hidden = false
    el.removeAttribute('hidden')
  }

  function applyLogoSlot(slot, row) {
    if (!row?.url) return
    document.querySelectorAll(`[data-image-slot="${slot}"]`).forEach((el) => {
      if (el.tagName === 'IMG') applyImg(el, row)
    })
    if (slot === 'favicon') {
      document.querySelectorAll('link[rel="icon"]').forEach((link) => {
        link.href = row.url
      })
    }
    // Hide SVG mark when a real logo image is present in the same brand block
    document.querySelectorAll('.brand').forEach((brand) => {
      const img = brand.querySelector('img.brand__logo')
      const mark = brand.querySelector('.brand__mark')
      if (img && !img.hidden && img.getAttribute('src') && mark) {
        mark.hidden = true
      }
    })
  }

  try {
    const rows = await media.fetchSiteImages()
    if (!rows.length) return

    applyLogoSlot('favicon', bySlot(rows, 'favicon'))
    applyLogoSlot('logo-nav', bySlot(rows, 'logo-nav'))
    applyLogoSlot('logo-footer', bySlot(rows, 'logo-footer'))

    applyImg(document.querySelector('[data-image-slot="hero"]'), bySlot(rows, 'hero'))
    applyImg(document.querySelector('[data-image-slot="hero-light"]'), bySlot(rows, 'hero-light'))

    ;['service-house', 'service-reconstruction', 'service-facade'].forEach((slot) => {
      const row = bySlot(rows, slot)
      const card = document.querySelector(`[data-image-slot="${slot}"]`)
      if (card && row?.url) {
        card.style.setProperty('--card-image', `url('${row.url}')`)
      }
    })
    applyImg(
      document.querySelector('[data-image-slot="service-featured"]'),
      bySlot(rows, 'service-featured'),
    )

    ;['team-1', 'team-2', 'team-3'].forEach((slot) => {
      applyImg(document.querySelector(`[data-image-slot="${slot}"]`), bySlot(rows, slot))
    })

    // The gallery is managed in the admin: every photo (also the former static ones) is a row.
    // Hidden photos are not shown on the site.
    const gallery = rows.filter((r) => r.category === 'gallery' && r.url && r.isVisible)
    window.UKSTAV_GALLERY_ROWS = gallery

    // Project pages show the gallery photos linked to that project (same order as in the admin).
    if (typeof PROJECTS !== 'undefined') {
      Object.keys(PROJECTS).forEach((pid) => {
        PROJECTS[pid].images = gallery.filter((r) => r.projectId === pid).map((r) => r.url)
      })
    }
  } catch (err) {
    console.warn('UKSTAV site images:', media.formatError?.(err) || err)
  } finally {
    // Tell the page the photo list is final (managed list, or the static fallback when null).
    window.UKSTAV_GALLERY_SETTLED = true
    if (window.app && typeof window.app.renderWorks === 'function') window.app.renderWorks()
    if (window.location.pathname.includes('project.html') && window.app?.loadProject) {
      const id = new URLSearchParams(window.location.search).get('id')
      if (id && typeof PROJECTS !== 'undefined' && Object.prototype.hasOwnProperty.call(PROJECTS, id)) {
        window.app.loadProject(PROJECTS[id])
      }
    }
  }
})()
