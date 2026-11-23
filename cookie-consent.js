/**
 * Minimal analytics consent for UKSTAV.
 * Loads Google Analytics (G-5NBV82L2WM) only after explicit accept.
 */
(function () {
    const STORAGE_KEY = 'ukstav_analytics_consent';
    const GA_ID = 'G-5NBV82L2WM';

    function getConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            /* ignore private mode */
        }
    }

    function loadGoogleAnalytics() {
        if (window.__ukstavGaLoaded) return;
        window.__ukstavGaLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, { anonymize_ip: true });

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(script);
    }

    function hideBanner(banner) {
        if (!banner) return;
        banner.classList.add('cookie-banner--hide');
        window.setTimeout(function () {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 280);
    }

    function showBanner() {
        if (document.getElementById('ukstavCookieBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'ukstavCookieBanner';
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', 'Súhlas s analytickými cookies');
        banner.innerHTML =
            '<div class="cookie-banner__inner">' +
            '<p class="cookie-banner__text">' +
            'Používame Google Analytics na meranie návštevnosti webu. ' +
            'Analytické cookies sa načítajú len po Vašom súhlase. ' +
            'Viac: <a href="ochrana-osobnych-udajov.html">Ochrana osobných údajov</a>.' +
            '</p>' +
            '<div class="cookie-banner__actions">' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-consent="denied">Odmietnuť</button>' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--primary" data-consent="granted">Prijať analytiku</button>' +
            '</div>' +
            '</div>';

        banner.addEventListener('click', function (event) {
            const btn = event.target.closest('[data-consent]');
            if (!btn) return;
            const value = btn.getAttribute('data-consent');
            setConsent(value);
            if (value === 'granted') {
                loadGoogleAnalytics();
            }
            hideBanner(banner);
        });

        document.body.appendChild(banner);
    }

    function init() {
        const consent = getConsent();
        if (consent === 'granted') {
            loadGoogleAnalytics();
            return;
        }
        if (consent === 'denied') {
            return;
        }
        showBanner();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
