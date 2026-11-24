/**
 * Apply managed site images from Supabase onto public pages.
 * Covers brand/logos, hero, services, gallery, team, and every project photo.
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
    const heroAlt = bySlot(rows, 'hero-alt')
    const heroAltEl = document.querySelector('[data-image-slot="hero-alt"]')
    if (heroAltEl && heroAlt) applyImg(heroAltEl, heroAlt)

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

    const galleryRows = rows.filter((r) => r.category === 'gallery')
    const galleryRoot = document.getElementById('siteGallery')
    if (galleryRoot && galleryRows.length) {
      galleryRoot.replaceChildren()
      for (const row of galleryRows) {
        const fig = document.createElement('figure')
        fig.className = 'gallery-item'
        const img = document.createElement('img')
        img.src = row.url
        img.alt = row.alt || 'Galéria UKSTAV'
        img.loading = 'lazy'
        fig.appendChild(img)
        galleryRoot.appendChild(fig)
      }
    }

    // Merge every project photo override into PROJECTS
    const workCovers = {}
    if (typeof PROJECTS !== 'undefined') {
      rows
        .filter((r) => r.category === 'works' && r.slot && r.url)
        .forEach((r) => {
          const m = String(r.slot).match(/^(project\d+)\/(thumbnail|images|gallery)(?:\/(\d+))?$/)
          if (!m) {
            // legacy cover slot "project1"
            if (PROJECTS[r.slot]) {
              workCovers[r.slot] = r
              PROJECTS[r.slot].thumbnail = r.url
            }
            return
          }
          const [, projectId, kind, indexStr] = m
          const project = PROJECTS[projectId]
          if (!project) return
          if (kind === 'thumbnail') {
            project.thumbnail = r.url
            workCovers[projectId] = r
          } else if (kind === 'images') {
            const i = Number(indexStr)
            if (!Array.isArray(project.images)) project.images = []
            project.images[i] = r.url
            if (i === 0) workCovers[projectId] = workCovers[projectId] || r
          } else if (kind === 'gallery') {
            const i = Number(indexStr)
            if (!Array.isArray(project.gallery)) project.gallery = []
            project.gallery[i] = r.url
          }
        })
    }
    window.UKSTAV_WORK_COVERS = workCovers

    if (window.app && typeof window.app.loadInitialProjects === 'function') {
      window.app.loadInitialProjects()
    }

    // If on project detail page, reload current project with merged images
    if (window.location.pathname.includes('project.html') && window.app?.loadProject) {
      const id = new URLSearchParams(window.location.search).get('id')
      if (id && typeof PROJECTS !== 'undefined' && PROJECTS[id]) {
        window.app.loadProject(PROJECTS[id])
      }
    }
  } catch (err) {
    console.warn('UKSTAV site images:', media.formatError?.(err) || err)
  }
})()
