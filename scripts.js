/**
 * scripts.js - UKSTAV website (vanilla JS, no build step)
 * - unified "Realizácie" gallery with filters
 * - contact / quick forms: saved to Supabase + opened in WhatsApp
 * - moderated reviews, project detail page, lightbox
 */

// ===== CONSTANTS & CONFIGURATION =====
const CONFIG = {
    PHONE_REGEX: /^[\+]?[\d\s\-\(\)]+$/,
    NAME_REGEX: /^[\p{L}\s.'’-]+$/u,
    SCROLL_THRESHOLD: 80,
    WORKS_PAGE_SIZE: 12,
    // WhatsApp number that receives requests (international format, digits only)
    WHATSAPP_NUMBER: '421950405659',
    // Max time we wait for Supabase before opening WhatsApp anyway
    GALLERY_WAIT_MS: 3500,
    SAVE_TIMEOUT_MS: 6000,
};

// ===== UTILITY FUNCTIONS =====
class Utils {
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    static smoothScroll(target, duration = 800) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const targetPosition = targetElement.offsetTop - 80; // Account for header
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const cleaned = phone.replace(/\s/g, '');
        return CONFIG.PHONE_REGEX.test(cleaned) && cleaned.length >= 9;
    }

    static validateName(name) {
        return CONFIG.NAME_REGEX.test(name.trim()) && name.trim().length >= 2;
    }

    static formatPhone(phone) {
        // Simple phone formatting for Slovak numbers
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('421')) {
            return '+' + [cleaned.slice(0, 3), cleaned.slice(3, 6), cleaned.slice(6, 9), cleaned.slice(9)]
                .filter(Boolean)
                .join(' ');
        }
        return phone;
    }
}

// ===== MAIN APPLICATION CLASS =====
class StavMasterWebsite {
    constructor() {
        this.currentProjectIndex = 0;
        this.loadedProjects = 0;
        this.currentLightboxIndex = 0;
        this.lightboxImages = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.initWorks();

        // Check if we're on project page
        if (window.location.pathname.includes('project.html')) {
            this.initProjectPage();
        }
    }

    setupEventListeners() {
        // Progress bar
        window.addEventListener('scroll', Utils.throttle(this.updateProgressBar.bind(this), 16));

        // Header shrinking
        window.addEventListener('scroll', Utils.throttle(this.handleHeaderScroll.bind(this), 16));

        // Mobile menu
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Navigation links
        document.addEventListener('click', this.handleNavigation.bind(this));

        // Forms
        this.setupFormHandlers();

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Window resize
        window.addEventListener('resize', Utils.debounce(this.handleResize.bind(this), 250));
        // Service cards jump to the gallery with the matching filter
        document.querySelectorAll('.service-card[data-filter]').forEach(card => {
            card.addEventListener('click', () => {
                const filter = card.dataset.filter;
                if (!filter) return;
                this.setWorksFilter(filter);
                Utils.smoothScroll('#works');
            });
            card.style.cursor = 'pointer';
        });
    }

    initializeComponents() {
        // Initialize intersection observer for animations
        this.setupIntersectionObserver();

        // Setup lazy loading for images
        this.setupLazyLoading();

        // Load accepted reviews from Supabase + form
        this.initReviews();
    }

    // ===== UNIFIED WORKS GALLERY (Realizácie + Galéria) =====
    initWorks() {
        this.worksState = { filter: 'all', visible: CONFIG.WORKS_PAGE_SIZE, photos: [], filtered: [] };
        if (!document.getElementById('worksGrid')) return;

        const fromUrl = new URLSearchParams(window.location.search).get('filter');
        if (fromUrl && WORK_TYPES.some(t => t.key === fromUrl)) {
            this.worksState.filter = fromUrl;
        }

        const loadMore = document.getElementById('loadMoreBtn');
        if (loadMore) {
            loadMore.addEventListener('click', () => {
                this.worksState.visible += CONFIG.WORKS_PAGE_SIZE;
                this.renderWorksGrid();
            });
        }

        const filters = document.getElementById('worksFilters');
        if (filters) {
            filters.addEventListener('click', (e) => {
                const chip = e.target.closest('[data-work-filter]');
                if (chip) this.setWorksFilter(chip.dataset.workFilter);
            });
        }

        if (this.galleryPending()) {
            // The photo list lives in Supabase: wait for it (so a deleted/hidden photo never flashes),
            // but never longer than a few seconds — then the static project photos are shown.
            const status = document.getElementById('worksStatus');
            if (status) status.textContent = 'Načítavam fotky…';
            setTimeout(() => {
                if (window.UKSTAV_GALLERY_SETTLED) return;
                window.UKSTAV_GALLERY_SETTLED = true;
                this.renderWorks();
            }, CONFIG.GALLERY_WAIT_MS);
        } else {
            this.renderWorks();
        }
    }

    /** True while the managed photo list (Supabase) is still being fetched. */
    galleryPending() {
        return !!(window.UkstavMedia && window.UkstavMedia.configured && !window.UKSTAV_GALLERY_SETTLED);
    }

    /** Rebuild the photo list (managed in the admin; static fallback) and redraw. */
    renderWorks() {
        const state = this.worksState;
        if (!state || !document.getElementById('worksGrid')) return;
        state.photos = buildPortfolioPhotos(Array.isArray(window.UKSTAV_GALLERY_ROWS) ? window.UKSTAV_GALLERY_ROWS : null);
        this.renderWorksFilters();
        this.renderWorksGrid();
    }

    setWorksFilter(key) {
        const state = this.worksState;
        if (!state) return;
        state.filter = WORK_TYPES.some(t => t.key === key) ? key : 'all';
        state.visible = CONFIG.WORKS_PAGE_SIZE;

        const url = new URL(window.location);
        if (state.filter === 'all') url.searchParams.delete('filter');
        else url.searchParams.set('filter', state.filter);
        window.history.replaceState({}, '', url);

        this.renderWorksFilters();
        this.renderWorksGrid();
    }

    renderWorksFilters() {
        const state = this.worksState;
        const root = document.getElementById('worksFilters');
        if (!root || !state) return;

        const counts = {};
        WORK_TYPES.forEach(t => { counts[t.key] = 0; });
        state.photos.forEach(p => p.types.forEach(k => { if (k in counts) counts[k] += 1; }));

        // A filter that has no photos at all would just show an empty page — hide it.
        const items = [{ key: 'all', label: 'Všetko', count: state.photos.length }]
            .concat(WORK_TYPES.filter(t => counts[t.key] > 0).map(t => ({ key: t.key, label: t.label, count: counts[t.key] })));
        if (!items.some(i => i.key === state.filter)) state.filter = 'all';

        root.replaceChildren();
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-chip' + (item.key === state.filter ? ' is-active' : '');
            btn.dataset.workFilter = item.key;
            btn.setAttribute('aria-pressed', item.key === state.filter ? 'true' : 'false');
            const label = document.createElement('span');
            label.textContent = item.label;
            const count = document.createElement('span');
            count.className = 'filter-chip__count';
            count.textContent = String(item.count);
            btn.append(label, count);
            root.appendChild(btn);
        });
    }

    renderWorksGrid() {
        const state = this.worksState;
        const grid = document.getElementById('worksGrid');
        if (!grid || !state) return;

        state.filtered = state.filter === 'all'
            ? state.photos
            : state.photos.filter(p => p.types.includes(state.filter));

        const shown = state.filtered.slice(0, state.visible);
        grid.replaceChildren();

        const frag = document.createDocumentFragment();
        shown.forEach((photo, index) => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'work-tile';
            tile.dataset.index = String(index);
            tile.setAttribute('aria-label', `Zväčšiť fotku: ${photo.title}`);

            const img = document.createElement('img');
            img.src = photo.thumb;
            img.alt = photo.alt;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.width = 480;
            img.height = 360;
            // If a generated preview is missing, fall back to the full photo
            img.addEventListener('error', () => {
                if (img.src !== new URL(photo.src, document.baseURI).href) img.src = photo.src;
            }, { once: true });

            const cap = document.createElement('span');
            cap.className = 'work-tile__cap';
            cap.textContent = photo.title;

            tile.append(img, cap);
            tile.addEventListener('click', () => this.openWorksLightbox(index));
            frag.appendChild(tile);
        });
        grid.appendChild(frag);

        const status = document.getElementById('worksStatus');
        if (status) {
            status.textContent = state.filtered.length
                ? `Zobrazených ${shown.length} z ${state.filtered.length} fotiek`
                : 'V tejto kategórii zatiaľ nie sú fotky.';
        }

        const loadMore = document.getElementById('loadMoreBtn');
        if (loadMore) loadMore.hidden = shown.length >= state.filtered.length;
    }

    openWorksLightbox(index) {
        const state = this.worksState;
        if (!state || !state.filtered.length) return;
        this.lightboxImages = state.filtered;
        this.openLightbox(index);
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
    }

    handleHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        const shouldShrink = window.pageYOffset > CONFIG.SCROLL_THRESHOLD;
        header.classList.toggle('shrink', shouldShrink);
    }

    toggleMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const nav = document.getElementById('nav');

        if (!toggle || !nav) return;

        const isActive = toggle.classList.contains('active');

        toggle.classList.toggle('active');
        nav.classList.toggle('active');

        // Update ARIA attributes
        toggle.setAttribute('aria-expanded', !isActive);

        // Prevent body scrolling when menu is open
        document.body.style.overflow = isActive ? '' : 'hidden';

        // Close menu when clicking outside
        if (!isActive) {
            document.addEventListener('click', this.closeMobileMenuOnOutsideClick.bind(this));
        }
    }

    closeMobileMenuOnOutsideClick(e) {
        const nav = document.getElementById('nav');
        const toggle = document.getElementById('mobileMenuToggle');

        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            this.closeMobileMenu();
            document.removeEventListener('click', this.closeMobileMenuOnOutsideClick.bind(this));
        }
    }

    closeMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const nav = document.getElementById('nav');

        if (toggle && nav) {
            toggle.classList.remove('active');
            nav.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    handleNavigation(e) {
        // Handle anchor links (support clicks on nested spans/icons inside <a>)
        const anchor = e.target.closest && e.target.closest('a[href^="#"]');
        if (anchor) {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                Utils.smoothScroll(targetElement);
                this.closeMobileMenu();
            }
        }
    }

    setupFormHandlers() {
        // Main contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactForm.bind(this));
            this.setupRealTimeValidation(contactForm);
        }

        // Quick contact modal form
        const quickForm = document.getElementById('quickContactForm');
        if (quickForm) {
            quickForm.addEventListener('submit', this.handleQuickContactForm.bind(this));
            this.setupRealTimeValidation(quickForm);
        }

        // Phone input formatting
        document.addEventListener('input', (e) => {
            if (e.target.type === 'tel') {
                e.target.value = Utils.formatPhone(e.target.value);
            }
        });
    }

    setupRealTimeValidation(form) {
        const inputs = form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', Utils.debounce(() => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            }, 300));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'name':
                isValid = Utils.validateName(value);
                errorMessage = 'Prosím, zadajte správne meno (minimálne 2 znaky)';
                break;
            case 'phone':
                isValid = Utils.validatePhone(value);
                errorMessage = 'Prosím, zadajte správne telefónne číslo';
                break;
            case 'email':
                if (value) { // Email is optional in some forms
                    isValid = Utils.validateEmail(value);
                    errorMessage = 'Prosím, zadajte správnu emailovú adresu';
                }
                break;
            case 'consent':
                isValid = field.checked;
                errorMessage = 'Potrebný súhlas so spracovaním údajov';
                break;
        }

        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    showFieldValidation(field, isValid, errorMessage) {
        const errorElement = document.getElementById(`${field.name}-error`);

        field.classList.toggle('error', !isValid);
        field.classList.toggle('success', isValid && field.value.trim());

        if (errorElement) {
            errorElement.textContent = isValid ? '' : errorMessage;
            errorElement.classList.toggle('visible', !isValid);
        }
    }

    async handleContactForm(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate all fields
        const fields = form.querySelectorAll('input, textarea');
        let isFormValid = true;

        fields.forEach(field => {
            if (field.name === 'website') return; // honeypot
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showFormError('Prosím, opravte chyby vo formulári');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Odosielam...';
        submitBtn.disabled = true;

        try {
            const result = await this.sendRequest({ ...data, source: 'contact' });
            this.showSuccessModal(null, result);
            form.reset();

            // Clear validation states
            fields.forEach(field => {
                field.classList.remove('error', 'success');
                const errorElement = document.getElementById(`${field.name}-error`);
                if (errorElement) {
                    errorElement.classList.remove('visible');
                }
            });
        } catch (error) {
            this.showFormError(error?.message || 'Nastala chyba pri odosielaní. Skúste znova.');
            console.error('Form submission error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleQuickContactForm(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Simple validation for quick form
        if (!Utils.validateName(data.name) || !Utils.validatePhone(data.phone)) {
            alert('Prosím, vyplňte všetky polia správne');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Odosielam...';
        submitBtn.disabled = true;

        try {
            const result = await this.sendRequest({ ...data, source: 'quick' });
            this.closeContactModal();
            this.showSuccessModal(data.callback_time, result);
            form.reset();
        } catch (error) {
            alert(error?.message || 'Nastala chyba pri odosielaní. Skúste znova.');
            console.error('Quick form submission error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * One request = two deliveries:
     *  1) saved in Supabase (leads table, visible in admin) — best effort, never blocks WhatsApp
     *  2) opened in WhatsApp with the message prefilled; the customer only presses "Send"
     * Returns { saved, whatsappUrl, whatsappOpened }.
     */
    async sendRequest(data) {
        // Honeypot: bots fill hidden fields. Pretend success, send nothing.
        if (data.website) {
            return { saved: true, whatsappUrl: null, whatsappOpened: false, bot: true };
        }

        const whatsappUrl = this.buildWhatsAppUrl(data);
        // Must be opened synchronously inside the click/submit handler, otherwise
        // mobile browsers treat it as a pop-up and block it.
        const waWindow = this.openWhatsAppWindow();

        let saved = false;
        try {
            await Promise.race([
                this.submitFormData(data),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), CONFIG.SAVE_TIMEOUT_MS)),
            ]);
            saved = true;
        } catch (err) {
            console.error('Lead not saved to Supabase (WhatsApp still opens):', err);
        }

        let whatsappOpened = false;
        if (waWindow && !waWindow.closed) {
            try {
                waWindow.location.replace(whatsappUrl);
                whatsappOpened = true;
            } catch (err) {
                console.error('WhatsApp window error:', err);
            }
        }
        return { saved, whatsappUrl, whatsappOpened };
    }

    buildWhatsAppUrl(data) {
        const clean = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
        const lines = [
            'Dobrý deň, posielam požiadavku z webu ukstav.sk:',
            `Meno: ${clean(data.name, 120)}`,
            `Telefón: ${clean(data.phone, 40)}`,
        ];
        const description = clean(data.description, 700);
        if (description) lines.push(`Popis: ${description}`);
        const callback = clean(data.callback_time, 40);
        if (callback) lines.push(`Kedy zavolať: ${callback}`);
        return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    }

    openWhatsAppWindow() {
        try {
            const win = window.open('', '_blank');
            if (!win) return null;
            try {
                win.opener = null;
                win.document.title = 'WhatsApp';
                win.document.body.style.cssText = 'font-family:sans-serif;background:#121212;color:#fafafa;padding:2rem';
                win.document.body.textContent = 'Otváram WhatsApp…';
            } catch (_) { /* cross-origin after navigation — ignore */ }
            return win;
        } catch (_) {
            return null;
        }
    }

    async submitFormData(data) {
        const api = window.UkstavLeads;
        if (!api?.configured) {
            throw new Error('Supabase nie je nakonfigurovaný.');
        }
        try {
            return await api.submitLead(data);
        } catch (err) {
            const detail = api.formatError ? api.formatError(err) : err?.message || String(err);
            throw new Error(detail);
        }
    }

    showFormError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.form-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error-message';
            errorDiv.style.cssText = `
        background: var(--color-error);
        color: white;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-base);
        margin-bottom: var(--space-4);
        font-size: var(--font-size-sm);
      `;
        }

        errorDiv.textContent = message;

        const form = document.querySelector('.contact-form, .modal__form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    setupIntersectionObserver() {
        if (!window.IntersectionObserver) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Observe elements that should animate in
        const animateElements = document.querySelectorAll('.team-card, .review-card, .pricing-step');
        animateElements.forEach(el => observer.observe(el));
    }

    setupLazyLoading() {
        if (!window.IntersectionObserver) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });

        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    initReviews() {
        this.loadAcceptedReviews();
        this.setupReviewForm();
    }

    escapeHtml(str) {
        return String(str || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
    }

    starsMarkup(rating) {
        const api = window.UkstavReviews;
        if (api?.starsHtml) return api.starsHtml(rating);
        const n = Math.max(0, Math.min(5, Number(rating) || 0));
        let html = '';
        for (let i = 1; i <= 5; i += 1) {
            html += i <= n ? '<span class="star">★</span>' : '<span class="star star--empty">☆</span>';
        }
        return html;
    }

    renderReviewCards(rows) {
        const track = document.getElementById('reviewsTrack');
        const empty = document.getElementById('reviewsEmpty');
        if (!track) return;

        track.replaceChildren();
        if (!rows.length) {
            if (empty) empty.hidden = false;
            return;
        }
        if (empty) empty.hidden = true;

        const frag = document.createDocumentFragment();
        rows.forEach((row) => {
            const article = document.createElement('article');
            article.className = 'review-card';
            const name = this.escapeHtml(row.author_name);
            const body = this.escapeHtml(row.body);
            const rating = Number(row.rating) || 0;
            article.innerHTML = `
                <div class="review-card__header">
                    <div class="review-card__info">
                        <h3 class="review-card__name">${name}</h3>
                        <div class="review-card__rating" aria-label="${rating} hviezdičiek z 5">
                            ${this.starsMarkup(rating)}
                        </div>
                    </div>
                </div>
                <p class="review-card__text">„${body}"</p>
            `;
            frag.appendChild(article);
        });
        track.appendChild(frag);
    }

    async loadAcceptedReviews() {
        const track = document.getElementById('reviewsTrack');
        if (!track) return;
        const api = window.UkstavReviews;
        if (!api?.configured) {
            this.renderReviewCards([]);
            return;
        }
        try {
            const rows = await api.fetchAcceptedReviews();
            this.renderReviewCards(rows);
        } catch (err) {
            console.error('Reviews load error:', err);
            this.renderReviewCards([]);
        }
    }

    setupReviewForm() {
        const form = document.getElementById('reviewForm');
        if (!form) return;

        const ratingInput = document.getElementById('reviewRatingInput');
        const ratingValue = document.getElementById('reviewRatingValue');
        const msgEl = document.getElementById('reviewFormMsg');
        const stars = ratingInput
            ? Array.from(ratingInput.querySelectorAll('.rating-star'))
            : [];

        const setRating = (rating) => {
            if (ratingValue) ratingValue.value = String(rating);
            stars.forEach((star) => {
                const n = Number(star.dataset.rating);
                star.classList.toggle('active', n <= rating);
                star.setAttribute('aria-checked', n === rating ? 'true' : 'false');
            });
        };

        stars.forEach((star) => {
            star.addEventListener('click', () => setRating(Number(star.dataset.rating)));
            star.addEventListener('mouseenter', () => {
                const hover = Number(star.dataset.rating);
                stars.forEach((s) => {
                    s.classList.toggle('active', Number(s.dataset.rating) <= hover);
                });
            });
        });
        ratingInput?.addEventListener('mouseleave', () => {
            setRating(Number(ratingValue?.value || 0));
        });

        const setMsg = (text, tone = '') => {
            if (!msgEl) return;
            msgEl.textContent = text || '';
            msgEl.className = 'review-form__msg' + (tone ? ` is-${tone}` : '');
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            setMsg('');
            const authorName = (document.getElementById('reviewName')?.value || '').trim();
            const rating = Number(ratingValue?.value || 0);
            const body = (document.getElementById('reviewBody')?.value || '').trim();
            const api = window.UkstavReviews;
            const btn = form.querySelector('button[type="submit"]');
            const original = btn?.textContent;

            if (!api?.configured) {
                setMsg('Recenzie momentálne nie sú dostupné. Skúste neskôr.', 'error');
                return;
            }

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Odosielam…';
                }
                await api.submitReview({ author_name: authorName, rating, body });
                form.reset();
                setRating(0);
                setMsg(
                    'Ďakujeme! Vaša recenzia bola odoslaná a zobrazí sa po schválení.',
                    'ok',
                );
            } catch (err) {
                setMsg(api.formatError?.(err) || err.message || 'Odoslanie zlyhalo.', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = original || 'Odoslať recenziu';
                }
            }
        });
    }

    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.closeAllModals();
            return;
        }

        // Arrow keys flip through photos while the lightbox is open
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            if (e.key === 'ArrowRight') this.nextImage();
            else if (e.key === 'ArrowLeft') this.prevImage();
        }
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 768) {
            this.closeMobileMenu();
        }
    }

    // ===== PROJECT PAGE FUNCTIONALITY =====
    initProjectPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (!projectId || !Object.prototype.hasOwnProperty.call(PROJECTS, projectId)) {
            this.showProjectError();
            return;
        }

        if (this.galleryPending()) {
            setTimeout(() => {
                if (window.UKSTAV_GALLERY_SETTLED) return;
                window.UKSTAV_GALLERY_SETTLED = true;
                this.loadProject(PROJECTS[projectId]);
            }, CONFIG.GALLERY_WAIT_MS);
            return;
        }
        this.loadProject(PROJECTS[projectId]);
    }

    loadProject(project) {
        const container = document.getElementById('projectContent');
        if (!container) return;
        const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];

        container.innerHTML = `
      <div class="project-hero">
        <h1 class="project-title">${project.title}</h1>
        <p class="project-subtitle">${project.subtitle}</p>
      </div>

      <div class="project-specs">
        <div class="project-spec">
          <span class="project-spec__label">Plocha</span>
          <span class="project-spec__value">${project.area}</span>
        </div>
        <div class="project-spec">
          <span class="project-spec__label">Doba realizácie</span>
          <span class="project-spec__value">${project.duration}</span>
        </div>
        <div class="project-spec">
          <span class="project-spec__label">Cena</span>
          <span class="project-spec__value">${project.price}</span>
        </div>
        <div class="project-spec">
          <span class="project-spec__label">Rok</span>
          <span class="project-spec__value">${project.year}</span>
        </div>
      </div>

      <div class="project-gallery">
        <h3>Fotogaléria</h3>
        ${images.length ? `<div class="gallery-grid">
          ${images.map((img, index) => `
            <div class="gallery-item" onclick="openLightbox(${index})" role="button" tabindex="0" aria-label="Otvoriť obrázok ${index + 1}">
              <img src="${img}" alt="${project.title} - foto ${index + 1}" loading="lazy" width="300" height="250">
            </div>
          `).join('')}
        </div>` : '<p class="loading">Fotky k tomuto projektu pripravujeme.</p>'}
      </div>

      <div class="project-description">
        <h3>O projekte</h3>
        <p>${project.description}</p>
      </div>
    `;

        // Store images for lightbox
        this.lightboxImages = images.map((src, index) => ({
            src,
            title: project.title,
            alt: `${project.title} - foto ${index + 1}`,
        }));

        // Update page title
        document.title = `${project.title} - UKstav`;
    }

    showProjectError() {
        const container = document.getElementById('projectContent');
        if (!container) return;

        container.innerHTML = `
      <div class="project-error" style="text-align: center; padding: var(--space-16) 0;">
        <h1>Projekt nenájdený</h1>
        <p style="color: var(--color-text-light); margin-bottom: var(--space-8);">
          Ľutujeme, požadovaný projekt neexistuje alebo bol odstránený.
        </p>
        <a href="index.html" class="btn btn--primary">Vrátiť sa na hlavnú</a>
      </div>
    `;
    }

    // ===== MODAL FUNCTIONALITY =====
    openContactModal() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');

            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }

            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        }
    }

    closeContactModal() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    showSuccessModal(callbackTime, result = {}) {
        const modal = document.getElementById('successModal');
        const messageElement = document.getElementById('successMessage');
        const waLink = document.getElementById('successWhatsapp');
        if (!modal || !messageElement) return;

        let message;
        if (result.bot) {
            message = 'Ďakujeme!';
        } else if (result.saved) {
            message = 'Vaša požiadavka bola prijatá! ';
            message += callbackTime
                ? `Zavoláme vám ${callbackTime}. `
                : 'Spojíme sa s vami do 2 hodín. ';
            if (result.whatsappUrl) {
                message += 'V okne WhatsApp stlačte „Odoslať“ — správa nám príde hneď.';
            }
        } else {
            message = 'Požiadavku sa nepodarilo uložiť na server. Stlačte tlačidlo nižšie a odošlite ju cez WhatsApp — alebo nám zavolajte na +421 950 405 659.';
        }
        messageElement.textContent = message;

        if (waLink) {
            if (result.whatsappUrl) {
                waLink.href = result.whatsappUrl;
                waLink.hidden = false;
                waLink.textContent = result.whatsappOpened
                    ? 'Otvoriť WhatsApp znova'
                    : 'Otvoriť WhatsApp a odoslať správu';
            } else {
                waLink.hidden = true;
            }
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        this.closeContactModal();
        this.closeSuccessModal();
        this.closeLightbox();
    }

    // ===== LIGHTBOX FUNCTIONALITY =====
    openLightbox(index) {
        if (!this.lightboxImages || !this.lightboxImages.length) return;

        this.currentLightboxIndex = index;
        const lightbox = document.getElementById('lightbox');

        if (lightbox) {
            lightbox.classList.add('active');
            lightbox.setAttribute('aria-hidden', 'false');
            this.updateLightboxImage();
            document.body.style.overflow = 'hidden';
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    nextImage() {
        if (!this.lightboxImages) return;

        this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.lightboxImages.length;
        this.updateLightboxImage();
    }

    prevImage() {
        if (!this.lightboxImages) return;

        this.currentLightboxIndex = this.currentLightboxIndex === 0
            ? this.lightboxImages.length - 1
            : this.currentLightboxIndex - 1;
        this.updateLightboxImage();
    }

    updateLightboxImage() {
        const image = document.getElementById('lightboxImage');
        const caption = document.getElementById('lightboxCaption');
        const counter = document.getElementById('lightboxCounter');
        const items = this.lightboxImages || [];
        const item = items[this.currentLightboxIndex];
        if (!item) return;

        const src = typeof item === 'string' ? item : item.src;
        const title = typeof item === 'string' ? `Obrázok ${this.currentLightboxIndex + 1}` : (item.title || '');

        if (image) {
            image.src = src;
            image.alt = (typeof item === 'object' && item.alt) || title;
        }

        if (caption) {
            caption.replaceChildren();
            if (title) {
                const strong = document.createElement('strong');
                strong.textContent = title;
                caption.appendChild(strong);
            }
            if (typeof item === 'object' && item.projectId && Object.prototype.hasOwnProperty.call(PROJECTS, item.projectId)) {
                const link = document.createElement('a');
                link.href = `project.html?id=${encodeURIComponent(item.projectId)}`;
                link.className = 'lightbox__link';
                link.textContent = 'Podrobnosti projektu →';
                caption.append(' ', link);
            }
        }

        if (counter) {
            counter.textContent = `${this.currentLightboxIndex + 1} / ${items.length}`;
        }
    }
}

// ===== GLOBAL FUNCTIONS (for HTML onclick handlers) =====
function openContactModal() {
    window.app.openContactModal();
}

function closeContactModal() {
    window.app.closeContactModal();
}

function closeSuccessModal() {
    window.app.closeSuccessModal();
}

function scrollToContact() {
    Utils.smoothScroll('#contact');
}

function openLightbox(index) {
    window.app.openLightbox(index);
}

function closeLightbox() {
    window.app.closeLightbox();
}

function nextImage() {
    window.app.nextImage();
}

function prevImage() {
    window.app.prevImage();
}

// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    window.app = new StavMasterWebsite();

    // Add some debugging info
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🏗️ StavMaster Website initialized');
        console.log('App instance:', window.app);
    }
});

// ===== SERVICE WORKER REGISTRATION (Progressive Web App) =====
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js')
//             .then(registration => {
//                 console.log('SW registered: ', registration);
//             })
//             .catch(registrationError => {
//                 console.log('SW registration failed: ', registrationError);
//             });
//     });
// }