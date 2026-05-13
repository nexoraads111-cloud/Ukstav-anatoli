/**
 * scripts.js - Complete JavaScript for StavMaster Construction Website
 * Pure vanilla JavaScript with modern ES6+ features
 * No external dependencies, progressive enhancement approach
 */

// ===== CONSTANTS & CONFIGURATION =====
const CONFIG = {
    PHONE_REGEX: /^[\+]?[\d\s\-\(\)]+$/,
    NAME_REGEX: /^[a-zA-Zá-žÁ-Ž\s]+$/,
    SCROLL_THRESHOLD: 80,
    PROJECTS_PER_LOAD: 9,
    PROJECTS_PER_LOAD_ACTIVE_FILER: 50,
    ANIMATION_DURATION: 300,
    ADDITIONAL_PROJECTS_PER_LOAD: 3,
};

const FILTER_STATE = {
    activeFilter: null
};

const translations = {
    'bathroom_kitchen': 'Kúpeľne a kuchyne na mieru',
    'reconstruction': 'Rekonštrukcie bytov a domov',
    'tiles': 'Obklady a dlažby',
    'house': 'Výstavba domov na kľúč',
    'roof': 'Strechy a sadrokartón',
    'facade': 'Fasády a zateplenie',
    // 'insulation': 'zateplenie',
    // 'sidewalk': 'chodníky',
    // 'concrete': 'betón',
    // 'apartment': 'byty',
    // 'drainage': 'drenáž',
    // 'garden': 'záhrada',
    // 'paving': 'dlažba',
    // 'kitchen': 'Kuchyne'
};

// Project data is loaded from projects.js

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
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
        }
        return phone;
    }

    static saveToLocalFile(data, filename = 'applications.txt') {
        // In a real implementation, this would send to server
        // For demo purposes, we'll save to localStorage
        const existingData = localStorage.getItem('applications') || '';
        const newData = `${existingData}\n${new Date().toISOString()}: ${JSON.stringify(data)}`;
        localStorage.setItem('applications', newData);
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
        this.checkFilterBeforeLoad();
        this.loadInitialProjects();
        this.initializeFiltering();

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
        const serviceCards = document.querySelectorAll('.service-card[data-filter]');
        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                const filter = card.dataset.filter;
                if (filter) {
                    // Update URL
                    const url = new URL(window.location);
                    url.searchParams.set('filter', filter);
                    window.history.pushState({}, '', url);

                    // Apply filter
                    this.applyFilter(filter);

                    // Scroll to works
                    setTimeout(() => {
                        Utils.smoothScroll('#works');
                    }, 300);
                }
            });

            // Add hover effect cursor
            card.style.cursor = 'pointer';
        });
    }

    initializeComponents() {
        // Initialize intersection observer for animations
        this.setupIntersectionObserver();

        // Setup lazy loading for images
        this.setupLazyLoading();

        // Initialize reviews slider
        this.initReviewsSlider();
    }

    checkFilterBeforeLoad() {
        // Check URL for filter parameter BEFORE loading projects
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');

        if (filterParam) {
            FILTER_STATE.activeFilter = filterParam;
        }
    }

    initializeFiltering() {
        // Apply filter AFTER projects are loaded
        if (FILTER_STATE.activeFilter) {
            this.applyFilter(FILTER_STATE.activeFilter);
            setTimeout(() => {
                Utils.smoothScroll('#works');
            }, 500);
        }
    }

    applyFilter(keyword) {
        FILTER_STATE.activeFilter = keyword;

        // Clear existing projects
        const worksGrid = document.getElementById('worksGrid');
        if (worksGrid) {
            worksGrid.innerHTML = '';
        }

        // Load ALL projects
        const projectKeys = getOrderedProjectKeys();
        projectKeys.forEach(projectId => {
            this.createProjectCard(PROJECTS[projectId], projectId);
        });

        // Now filter them
        this.filterProjects(keyword);
        this.updateFilterIndicator(keyword);
    }

    filterProjects(keyword) {
        const projectCards = document.querySelectorAll('.work-card');
        const keywords = keyword.split(',');
        let visibleCount = 0;

        projectCards.forEach(card => {
            const projectId = card.dataset.projectId;
            const project = PROJECTS[projectId];

            const hasMatch = keywords.some(k =>
                project && project.keywords && project.keywords.includes(k.trim())
            );

            if (!hasMatch) {
                card.remove();
            } else {
                visibleCount++;
            }
        });

        // Hide load more button when filtering
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    clearFilter() {
        FILTER_STATE.activeFilter = null;

        // Remove filter from URL
        const url = new URL(window.location);
        url.searchParams.delete('filter');
        window.history.pushState({}, '', url);

        // Clear the grid completely
        const worksGrid = document.getElementById('worksGrid');
        if (worksGrid) {
            worksGrid.innerHTML = '';
        }

        // Reload only PROJECTS_PER_LOAD projects
        const projectKeys = getOrderedProjectKeys();
        const initialProjects = projectKeys.slice(0, CONFIG.PROJECTS_PER_LOAD);

        initialProjects.forEach(projectId => {
            this.createProjectCard(PROJECTS[projectId], projectId);
        });

        this.loadedProjects = CONFIG.PROJECTS_PER_LOAD;

        // Hide filter indicator
        const indicator = document.getElementById('filterIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }

        // Show load more button if there are more projects
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn && this.loadedProjects < projectKeys.length) {
            loadMoreBtn.style.display = 'inline-block';
        }
    }

    updateFilterIndicator(keyword) {
        const translatedKeyword = translations[keyword] || keyword;

        let indicator = document.getElementById('filterIndicator');
        if (!indicator) {
            const worksSection = document.querySelector('.works .container');
            const sectionTitle = worksSection.querySelector('.section-title');

            indicator = document.createElement('div');
            indicator.id = 'filterIndicator';
            indicator.className = 'filter-indicator';
            indicator.innerHTML = `
            <span class="filter-indicator__text">Aktívny filter: <strong>${translatedKeyword}</strong></span>
            <button class="btn btn--small btn--secondary" onclick="clearFilter()">Zobraziť všetky projekty</button>
        `;
            sectionTitle.after(indicator);
        } else {
            indicator.querySelector('.filter-indicator__text strong').textContent = translatedKeyword;
            indicator.style.display = 'flex';
        }
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
        // Handle anchor links
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href');
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
            // Simulate API call
            await this.submitFormData(data);

            // Save locally for demo
            Utils.saveToLocalFile(data);

            // Show success
            this.showSuccessModal();
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
            this.showFormError('Nastala chyba pri odosielaní. Skúste znova.');
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
            await this.submitFormData(data);
            Utils.saveToLocalFile(data);
            this.closeContactModal();
            this.showSuccessModal(data.callback_time);
            form.reset();
        } catch (error) {
            alert('Nastala chyba pri odosielaní. Skúste znova.');
            console.error('Quick form submission error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async submitFormData(data) {
        const response = await fetch('https://ukstav.sk/send-telegram.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok' + JSON.stringify(response));
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Unknown error');
        }

        return result;
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

    loadInitialProjects() {
        const worksGrid = document.getElementById('worksGrid');
        if (!worksGrid) return;

        const projectKeys = getOrderedProjectKeys();
        // const projectsToLoad = projectKeys.slice(0, 10);

        // If filter is active, load ALL projects, otherwise load limited
        const projectsToLoad = FILTER_STATE.activeFilter
            ? projectKeys.slice(0, CONFIG.PROJECTS_PER_LOAD_ACTIVE_FILER)
            : projectKeys.slice(0, CONFIG.PROJECTS_PER_LOAD);

        projectsToLoad.forEach(projectId => {
            this.createProjectCard(PROJECTS[projectId], projectId);
        });

        this.loadedProjects = projectsToLoad.length;

        // Hide load more button if no more projects OR filter is active
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn && (this.loadedProjects >= projectKeys.length || FILTER_STATE.activeFilter)) {
            loadMoreBtn.style.display = 'none';
        }
    }

    createProjectCard(project, projectId) {
        const worksGrid = document.getElementById('worksGrid');
        if (!worksGrid) return;

        const card = document.createElement('article');
        card.className = 'work-card animate-in';
        card.dataset.projectId = projectId;
        card.innerHTML = `
      <div class="work-card__image">
        <img src="${project.thumbnail}" alt="${project.title}" loading="lazy" width="400" height="250">
      </div>
      <div class="work-card__gallery">
        ${project.gallery.map(thumb => `
          <div class="work-card__thumb">
            <img src="${thumb}" alt="${project.title}" loading="lazy" width="60" height="60">
          </div>
        `).join('')}
      </div>
      <div class="work-card__content">
        <h3 class="work-card__title">${project.title}</h3>
        <p class="work-card__description">${project.subtitle}</p>
        <a href="project.html?id=${projectId}" class="btn btn--primary">
          Podrobnosti
        </a>
      </div>
    `;

        worksGrid.appendChild(card);
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
        const animateElements = document.querySelectorAll('.work-card, .team-card, .review-card, .pricing-step');
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

    initReviewsSlider() {
        const track = document.getElementById('reviewsTrack');
        if (!track) return;

        // Clone reviews for infinite scroll effect
        const reviews = track.innerHTML;
        track.innerHTML = reviews;

        // Pause animation on hover
        track.addEventListener('mouseenter', () => {
            track.style.animationPlayState = 'paused';
        });

        track.addEventListener('mouseleave', () => {
            track.style.animationPlayState = 'running';
        });
    }

    handleKeyboard(e) {
        // Escape key handling
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Enter key for buttons
        if (e.key === 'Enter' && e.target.matches('button, .btn')) {
            e.target.click();
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
        const token = urlParams.get('token');

        if (!projectId || !PROJECTS[projectId]) {
            this.showProjectError();
            return;
        }

        this.loadProject(PROJECTS[projectId]);
        this.loadProjectComments(projectId);

        if (token) {
            this.validateCommentToken(projectId, token);
        }
    }

    loadProject(project) {
        const container = document.getElementById('projectContent');
        if (!container) return;

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
        <div class="gallery-grid">
          ${project.images.map((img, index) => `
            <div class="gallery-item" onclick="openLightbox(${index})" role="button" tabindex="0" aria-label="Otvoriť obrázok ${index + 1}">
              <img src="${img}" alt="${project.title} - foto ${index + 1}" loading="lazy" width="300" height="250">
            </div>
          `).join('')}
        </div>
      </div>

      <div class="project-description">
        <h3>O projekte</h3>
        <p>${project.description}</p>
      </div>
    `;

        // Store images for lightbox
        this.lightboxImages = project.images;

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

    showSuccessModal(callbackTime) {
        const modal = document.getElementById('successModal');
        const messageElement = document.getElementById('successMessage');

        let message = 'Vaša požiadavka bola prijatá! ';

        if (callbackTime) {
            message += `Zavoláme vám ${callbackTime}.`;
        } else {
            message += 'Spojíme sa s vami do 2 hodín pre upresnenie detailov a dohodnutie stretnutia.';
        }

        messageElement.textContent = message;
        modal.classList.add('active');
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

        if (image && this.lightboxImages) {
            image.src = this.lightboxImages[this.currentLightboxIndex];
            image.alt = `Obrázok ${this.currentLightboxIndex + 1}`;
        }

        if (caption) {
            caption.textContent = `Obrázok ${this.currentLightboxIndex + 1}`;
        }

        if (counter) {
            counter.textContent = `${this.currentLightboxIndex + 1} / ${this.lightboxImages.length}`;
        }
    }

    // Add after initProjectPage method
    async validateCommentToken(projectId, token) {
        try {
            const response = await fetch(`db/validate-token.php?token=${token}&project_id=${projectId}`);
            const result = await response.json();

            if (result.success) {
                const formContainer = document.getElementById('commentFormContainer');
                if (formContainer) {
                    formContainer.style.display = 'block';

                    const nameInput = document.getElementById('customerName');
                    if (nameInput && result.data.customer_name) {
                        nameInput.value = result.data.customer_name;
                    }

                    this.setupCommentForm(projectId, token);
                }
            }
        } catch (error) {
            console.error('Token validation error:', error);
        }
    }

    setupCommentForm(projectId, token) {
        const form = document.getElementById('commentForm');
        const ratingStars = document.querySelectorAll('.rating-star');
        const ratingValue = document.getElementById('ratingValue');

        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                ratingValue.value = rating;

                ratingStars.forEach(s => {
                    const starRating = parseInt(s.dataset.rating);
                    s.classList.toggle('active', starRating <= rating);
                });
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const customerName = document.getElementById('customerName').value.trim();
            const rating = parseInt(ratingValue.value);
            const commentText = document.getElementById('commentText').value.trim();

            if (!customerName || rating < 1 || !commentText) {
                alert('Prosím vyplňte všetky polia');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Odosielam...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('db/submit-comment.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: token,
                        project_id: projectId,
                        customer_name: customerName,
                        rating: rating,
                        comment_text: commentText
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Ďakujeme za vaše hodnotenie!');
                    form.reset();
                    document.getElementById('commentFormContainer').style.display = 'none';
                    this.loadProjectComments(projectId);
                } else {
                    alert(result.message || 'Chyba pri odosielaní');
                }
            } catch (error) {
                alert('Chyba pri odosielaní komentára');
                console.error('Comment submission error:', error);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    async loadProjectComments(projectId) {
        try {
            const response = await fetch(`db/get-comments.php?project_id=${projectId}`);
            const result = await response.json();

            const container = document.getElementById('commentsContainer');
            const noComments = document.getElementById('noComments');

            if (result.success && result.comments.length > 0) {
                container.innerHTML = result.comments.map(comment => `
        <div class="comment-card">
          <div class="comment-header">
            <span class="comment-author">${this.escapeHtml(comment.customer_name)}</span>
            <div class="comment-rating">
              ${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}
            </div>
          </div>
          <p class="comment-text">${this.escapeHtml(comment.comment_text)}</p>
          <div class="comment-date">${this.formatDate(comment.created_at)}</div>
        </div>
      `).join('');
                noComments.style.display = 'none';
            } else {
                container.innerHTML = '';
                noComments.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('sk-SK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

function loadMoreProjects() {
    const projectKeys = getOrderedProjectKeys();
    const remainingProjects = projectKeys.slice(window.app.loadedProjects, window.app.loadedProjects + CONFIG.ADDITIONAL_PROJECTS_PER_LOAD); // Load 1 at a time

    remainingProjects.forEach(projectId => {
        window.app.createProjectCard(PROJECTS[projectId], projectId);
    });

    window.app.loadedProjects += remainingProjects.length;

    // Hide button if no more projects
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn && window.app.loadedProjects >= projectKeys.length) {
        loadMoreBtn.style.display = 'none';
    }
}

function clearFilter() {
    window.app.clearFilter();
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
        console.log('Dostupné projekty:', getOrderedProjectKeys());
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