/*
 * Light / dark theme switch. Loaded in <head> (no defer) so the right theme
 * is set before the first paint — no flash of the wrong colours.
 * Choice is remembered in localStorage; without a choice the visitor's system setting is used.
 */
;(function () {
  var KEY = 'ukstav-theme'
  var root = document.documentElement
  var LABEL = { light: 'Prepnúť na tmavú tému', dark: 'Prepnúť na svetlú tému' }

  function stored() {
    try {
      var v = localStorage.getItem(KEY)
      return v === 'light' || v === 'dark' ? v : null
    } catch (e) {
      return null
    }
  }
  function system() {
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch (e) {
      return 'dark'
    }
  }
  function syncButtons(theme) {
    var btns = document.querySelectorAll('[data-theme-toggle]')
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-label', LABEL[theme])
      btns[i].setAttribute('title', LABEL[theme])
      btns[i].setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false')
    }
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme)
    var meta = document.querySelector('meta[name="theme-color"]')
    if (!meta && document.head) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    if (meta) meta.content = theme === 'light' ? '#faf7f2' : '#121212'
    syncButtons(theme)
  }

  apply(stored() || system())

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-theme-toggle]')
    if (!btn) return
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
    try {
      localStorage.setItem(KEY, next)
    } catch (err) {}
    apply(next)
  })

  document.addEventListener('DOMContentLoaded', function () {
    syncButtons(root.getAttribute('data-theme'))
  })

  try {
    var mq = window.matchMedia('(prefers-color-scheme: light)')
    var onChange = function () {
      if (!stored()) apply(system())
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
  } catch (e) {}
})()
