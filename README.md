<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projekt - Stavebné práce a rekonštrukcie</title>
    <meta name="description" content="Stavebná firma UKstav – Bratislava a okolie. Výstavba domov na klúč, rekonštrukcie, fasády, obklady, strechy. Zakladatelia Anatolij Porokhnavets a Michal Kovac. Rýchla cenová ponuka, kvalita a spolahlivost.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <link rel="icon" type="image/png" href="images/ukstav_logo.png">
</head>
<body>
<!-- Simple Header -->
<header class="header header--simple" id="header" role="banner">
    <div class="container">
        <div class="header__content">
            <a href="index.html" class="back-link" aria-label="Vrátiť sa na hlavnú stránku">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                Späť
            </a>

            <div class="header__logo">
                <img src="images/ukstav_logo.png" alt="StavMaster">
                <a href="#header" class="logo-text">UKSTAV</a>
            </div>

            <a href="tel:+421950405659" class="header__phone" aria-label="Zavolať +421 950 405 659">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +421 950 405 659
            </a>
        </div>
    </div>
</header>

<main role="main">

    <!-- Comment Form (shown only with valid token) -->
    <section class="project-comments" id="commentFormContainer" style="display: none;">
        <div class="container">
            <div class="comment-form-wrapper">
                <h3>Ohodnoťte tento projekt</h3>
                <p>Vaša spätná väzba je pre nás dôležitá</p>

                <form id="commentForm" class="comment-form">
                    <div class="form-group">
                        <label for="customerName" class="form-label">Vaše meno *</label>
                        <input type="text" id="customerName" name="customer_name" class="form-input" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Hodnotenie *</label>
                        <div class="rating-input" id="ratingInput">
                            <span class="rating-star" data-rating="1">★</span>
                            <span class="rating-star" data-rating="2">★</span>
                            <span class="rating-star" data-rating="3">★</span>
                            <span class="rating-star" data-rating="4">★</span>
                            <span class="rating-star" data-rating="5">★</span>
                        </div>
                        <input type="hidden" id="ratingValue" name="rating" value="0">
                        <div class="error-message" id="rating-error" role="alert"></div>
                    </div>

                    <div class="form-group">
                        <label for="commentText" class="form-label">Váš komentár *</label>
                        <textarea id="commentText" name="comment_text" class="form-input" rows="5" required placeholder="Popíšte vašu skúsenosť s projektom..."></textarea>
                        <div class="error-message" id="comment-error" role="alert"></div>
                    </div>

                    <button type="submit" class="btn btn--primary btn--large">
                        Odoslať hodnotenie
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Project Details -->
    <section class="project-details">
        <div class="container">
            <!-- Project will be loaded here by JavaScript -->
            <div id="projectContent">
                <div class="loading">
                    <p>Načítavam projekt...</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Comments Section -->
    <section class="project-comments">
        <div class="container">
            <h2 class="section-title">Hodnotenie zákazníka</h2>
            <!-- Existing Comments Display -->
            <div id="commentsDisplay" class="comments-list">
                <div id="commentsContainer"></div>
                <div id="noComments" class="no-comments" style="display: none;">
                    <p>Zatiaľ žiadne hodnotenie pre tento projekt.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact CTA -->
    <section class="project-cta">
        <div class="container">
            <div class="cta-card">
                <h2>Chcete podobný projekt?</h2>
                <p>Pošlite požiadavku a získajte bezplatnú konzultáciu pre váš projekt</p>
                <div class="cta-actions">
                    <a href="index.html#contact" class="btn btn--primary">Získať rozpočet</a>
                    <a href="https://wa.me/421950405659" class="btn btn--whatsapp" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.488"/>
                        </svg>
                        WhatsApp
                    </a>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- Footer -->
<footer class="footer footer--simple" role="contentinfo">
    <div class="container">
        <div class="footer__simple">
            <div class="footer__info">
                <h3>UKSTAV</h3>
                <p class="footer__description">
                    Profesionálne stavebné práce a rekonštrukcie v Bratislave od roku 2008.
                    Kvalita, spoľahlivosť, záruka.
                </p>
            </div>
            <div class="footer__contacts">
                <h3>Kontakt</h3>
                <address class="footer__address">
                    <p>Obchodná 559/37</p>
                    <p>811 06 Bratislava – Staré Mesto, Slovenská republika</p>
                    <p>
                        <a href="tel:+421950405659">Anatolij Porokhnavets – konateľ: <br>+421 950 405 659</a><br>
                        <a href="tel:+421951827835">Mihajlo Kovač – konateľ: <br>+421 951 827 835</a><br>
                        <a href="mailto:ukstav.sk@gmail.com">ukstav.sk@gmail.com</a>
                    </p>
                </address>
            </div>
            <div class="footer__social">
                <h3>Sociálne siete</h3>
                <div class="social-links">
                    <a href="https://wa.me/421950405659" class="social-link" aria-label="WhatsApp" target="_blank"
                       rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.488"/>
                        </svg>
                    </a>
                    <!--                    <a href="https://t.me/stavmastersk" class="social-link" aria-label="Telegram" target="_blank" rel="noopener">-->
                    <!--                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">-->
                    <!--                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>-->
                    <!--                        </svg>-->
                    <!--                    </a>-->
                    <a href="https://facebook.com/profile.php?id=61565539918906&mibextid=LQQJ4d" class="social-link"
                       aria-label="Facebook" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                    <a href="https://instagram.com/uk_stav/" class="social-link" aria-label="Instagram" target="_blank"
                       rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
        <div class="footer__bottom">
            <p>&copy; 2025 UKStav. Všetky práva vyhradené.</p>
        </div>
    </div>
</footer>

<!-- Image Lightbox Modal -->
<div class="lightbox" id="lightbox" role="dialog" aria-labelledby="lightboxTitle" aria-hidden="true">
    <div class="lightbox__backdrop" onclick="closeLightbox()"></div>
    <div class="lightbox__content">
        <button class="lightbox__close" onclick="closeLightbox()" aria-label="Zavrieť">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
        <button class="lightbox__prev" onclick="prevImage()" aria-label="Predchádzajúci obrázok">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
        </button>
        <button class="lightbox__next" onclick="nextImage()" aria-label="Nasledujúci obrázok">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        </button>
        <img class="lightbox__image" id="lightboxImage" alt="">
        <div class="lightbox__caption" id="lightboxCaption"></div>
        <div class="lightbox__counter" id="lightboxCounter"></div>
    </div>
</div>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5NBV82L2WM"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-5NBV82L2WM');
</script>
<script src="projects.js"></script>
<script src="scripts.js"></script>
</body>
</html>