/**
 * Apply managed site images from Supabase onto the public homepage.
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
  }

  try {
    const rows = await media.fetchSiteImages()
    if (!rows.length) return

    const hero = bySlot(rows, 'hero')
    applyImg(document.querySelector('[data-image-slot="hero"]'), hero)

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

    // Override project covers for Realizácie cards
    const workCovers = {}
    rows
      .filter((r) => r.category === 'works' && r.slot)
      .forEach((r) => {
        if (!workCovers[r.slot]) workCovers[r.slot] = r
      })
    window.UKSTAV_WORK_COVERS = workCovers

    if (typeof PROJECTS !== 'undefined') {
      Object.keys(workCovers).forEach((projectId) => {
        const cover = workCovers[projectId]
        if (!PROJECTS[projectId] || !cover?.url) return
        PROJECTS[projectId].thumbnail = cover.url
        if (Array.isArray(PROJECTS[projectId].images) && PROJECTS[projectId].images.length) {
          PROJECTS[projectId].images = [cover.url, ...PROJECTS[projectId].images.slice(1)]
        }
      })
    }

    // Re-render works grid if already initialized (covers may have arrived after first paint)
    if (window.app && typeof window.app.loadInitialProjects === 'function') {
      window.app.loadInitialProjects()
    }
  } catch (err) {
    console.warn('UKSTAV site images:', media.formatError?.(err) || err)
  }
})()
