<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UKstav - Stavebné práce a rekonštrukcie</title>
    <meta name="description" content="Stavebná firma UKstav – Bratislava a okolie. Výstavba domov na klúč, rekonštrukcie, fasády, obklady, strechy. Zakladatelia Anatolij Porokhnavets a Michal Kovac. Rýchla cenová ponuka, kvalita a spolahlivost.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <link rel="icon" type="image/png" href="images/ukstav_logo_2.png">
</head>
<body>
<!-- Progress Bar -->
<div id="progress-bar" aria-hidden="true"></div>

<!-- Header -->
<header class="header" id="header" role="banner">
    <div class="container">
        <div class="header__content">
            <!-- Logo -->
            <div class="header__logo">
<!--                <img src="images/ukstav_logo_3.png" alt="StavMaster">-->
                <a href="#header" class="logo-text">UKSTAV</a>
            </div>

            <!-- Contact Info -->
            <div class="header__contact">
                <a href="tel:+421950405659" class="header__phone" aria-label="Zavolať +421 950 405 659">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    +421 950 405 659
                </a>

                <button class="btn btn--secondary btn--small" onclick="openContactModal()" aria-label="Zanechať telefónne číslo">
                    Zanechať číslo
                </button>

                <!-- Social Links -->
                <div class="header__social">
                    <a href="https://wa.me/421950405659" class="social-link" aria-label="WhatsApp" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.488"/>
                        </svg>
                    </a>
<!--                    <a href="https://t.me/stavmastersk" class="social-link" aria-label="Telegram" target="_blank" rel="noopener">-->
<!--                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">-->
<!--                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>-->
<!--                        </svg>-->
<!--                    </a>-->
                    <a href="https://www.facebook.com/profile.php?id=61565539918906&mibextid=LQQJ4d" class="social-link" aria-label="Facebook" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                    <a href="https://www.instagram.com/uk_stav/" class="social-link" aria-label="Instagram" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Mobile Menu Toggle -->
<!--            <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Otvoriť menu" aria-expanded="false">-->
<!--                <span></span>-->
<!--                <span></span>-->
<!--                <span></span>-->
<!--            </button>-->

            <!-- Navigation -->
<!--            <nav class="nav" id="nav" role="navigation" aria-label="Hlavná navigácia">-->
<!--                <ul class="nav__list">-->
<!--                    <li><a href="#works" class="nav__link">Naše práce</a></li>-->
<!--                    <li><a href="#team" class="nav__link">Tím</a></li>-->
<!--                    <li><a href="#pricing" class="nav__link">Cena</a></li>-->
<!--                    <li><a href="#reviews" class="nav__link">Recenzie</a></li>-->
<!--                    <li><a href="#contact" class="nav__link">Kontakt</a></li>-->
<!--                </ul>-->
<!--            </nav>-->
        </div>
    </div>
</header>

<main role="main">
    <!-- Hero Section -->
    <section class="hero" id="hero" role="banner">
        <div class="container">
            <div class="hero__content">
                <h1 class="hero__title">
                    Stavebná spoločnosť<br>
                    <span class="hero__title--accent">pre domy, ktoré vydržia generácie</span>
                </h1>
                <p class="hero__subtitle">
                    Výstavba domov na kľúč, rekonštrukcie bytov a domov, fasády, interiéry a strechy. Transparentné rozpočty a fixné termíny.
                </p>
                <div class="hero__actions">
                    <button class="btn btn--primary btn--large" onclick="scrollToContact()">
                        Získať bezplatný rozpočet
                    </button>
                    <a href="https://wa.me/421950405659" class="btn btn--whatsapp" target="_blank" rel="noopener" aria-label="Napísať na WhatsApp">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.488"/>
                        </svg>
                        WhatsApp
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Company Info Section -->
    <section class="company-info" id="company-info">
        <div class="container">
            <div class="company-info__wrapper">
                <div class="company-info__header">
                    <h2>UKSTAV SLOVAKIA s. r. o.</h2>
                </div>

                <div class="company-info__grid">
                    <div class="company-info__item">
                        <span class="company-info__icon">🏢</span>
                        <div class="company-info__details">
                            <strong>Adresa sídla</strong>
                            <p>Obchodná 559/37, 811 06 Bratislava – Staré Mesto, Slovenská republika</p>
                        </div>
                    </div>

                    <div class="company-info__item">
                        <span class="company-info__icon">🆔</span>
                        <div class="company-info__details">
                            <strong>IČO</strong>
                            <p>57 177 945</p>
                        </div>
                    </div>

                    <div class="company-info__item">
                        <span class="company-info__icon">💳</span>
                        <div class="company-info__details">
                            <strong>DIČ</strong>
                            <p>2122 589 9974</p>
                        </div>
                    </div>

                    <div class="company-info__item">
                        <span class="company-info__icon">✉️</span>
                        <div class="company-info__details">
                            <strong>E-mail</strong>
                            <p><a href="mailto:ukstav.sk@gmail.com">ukstav.sk@gmail.com</a></p>
                        </div>
                    </div>

                    <div class="company-info__item company-info__item--phones">
                        <span class="company-info__icon">📞</span>
                        <div class="company-info__details">
                            <strong>Kontakty konateľov</strong>
                            <div class="company-info__phones">
                                <p>
                                    <span class="phone-name">Anatolij Porokhnavets – konateľ</span>
                                    <a href="tel:+421950405659" class="phone-number">+421 950 405 659</a>
                                </p>
                                <p>
                                    <span class="phone-name">Mihajlo Kovač – konateľ</span>
                                    <a href="tel:+421951827835" class="phone-number">+421 951 827 835</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

<!--    <section class="hero" id="hero" role="banner">-->
<!--        <div class="container">-->
<!--            <div class="hero__content">-->
<!--                &lt;!&ndash; Remove old h1 and p tags &ndash;&gt;-->

<!--                <div class="hero__actions">-->
<!--                    <button class="btn btn&#45;&#45;primary btn&#45;&#45;large" onclick="scrollToContact()">-->
<!--                        Získať bezplatný rozpočet-->
<!--                    </button>-->
<!--                    <a href="https://wa.me/421950405659" class="btn btn&#45;&#45;whatsapp" target="_blank" rel="noopener" aria-label="Napísať na WhatsApp">-->
<!--                        &lt;!&ndash; WhatsApp SVG &ndash;&gt;-->
<!--                        WhatsApp-->
<!--                    </a>-->
<!--                </div>-->

<!--                &lt;!&ndash; Company Info Card &ndash;&gt;-->
<!--                <div class="hero__company-info">-->
<!--                    <div class="company-info-card">-->
<!--                        <h3 class="company-info__title">UKSTAV SLOVAKIA s. r. o.</h3>-->

<!--                        <div class="company-info__grid">-->
<!--                            <div class="company-info__item">-->
<!--                                <div class="company-info__icon">🏢</div>-->
<!--                                <div class="company-info__content">-->
<!--                                    <span class="company-info__label">Adresa sídla</span>-->
<!--                                    <span class="company-info__value">Obchodná 559/37, 811 06 Bratislava – Staré Mesto</span>-->
<!--                                </div>-->
<!--                            </div>-->

<!--                            <div class="company-info__item">-->
<!--                                <div class="company-info__icon">🆔</div>-->
<!--                                <div class="company-info__content">-->
<!--                                    <span class="company-info__label">IČO</span>-->
<!--                                    <span class="company-info__value">57 177 945</span>-->
<!--                                </div>-->
<!--                            </div>-->

<!--                            <div class="company-info__item">-->
<!--                                <div class="company-info__icon">💳</div>-->
<!--                                <div class="company-info__content">-->
<!--                                    <span class="company-info__label">DIČ</span>-->
<!--                                    <span class="company-info__value">2122 589 9974</span>-->
<!--                                </div>-->
<!--                            </div>-->

<!--                            <div class="company-info__item">-->
<!--                                <div class="company-info__icon">✉️</div>-->
<!--                                <div class="company-info__content">-->
<!--                                    <span class="company-info__label">E-mail</span>-->
<!--                                    <a href="mailto:ukstav.sk@gmail.com" class="company-info__value company-info__link">ukstav.sk@gmail.com</a>-->
<!--                                </div>-->
<!--                            </div>-->

<!--                            <div class="company-info__item company-info__item&#45;&#45;contacts">-->
<!--                                <div class="company-info__icon">📞</div>-->
<!--                                <div class="company-info__content">-->
<!--                                    <span class="company-info__label">Kontakty konateľov</span>-->
<!--                                    <div class="company-info__contacts">-->
<!--                                        <div class="contact-person">-->
<!--                                            <span class="contact-person__name">Anatolij Porokhnavets</span>-->
<!--                                            <a href="tel:+421950405659" class="contact-person__phone">+421 950 405 659</a>-->
<!--                                        </div>-->
<!--                                        <div class="contact-person">-->
<!--                                            <span class="contact-person__name">Mihajlo Kovač</span>-->
<!--                                            <a href="tel:+421951827835" class="contact-person__phone">+421 951 827 835</a>-->
<!--                                        </div>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                            </div>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                </div>-->

<!--            </div> &lt;!&ndash; Close hero__content &ndash;&gt;-->
<!--        </div> &lt;!&ndash; Close container &ndash;&gt;-->
<!--    </section>-->
    <section class="services" id="services">
        <div class="container">
            <h2 class="section-title">Naše služby</h2>
            <div class="services__grid">
                <div class="service-card" data-filter="house">
                    <h3>Výstavba domov na kľúč</h3>
                    <p>Kompletná realizácia rodinných domov od základov po kolaudáciu</p>
                    <span class="service-card__hint">Kliknutím zobraziť túto kategóriu</span>
                </div>
                <div class="service-card" data-filter="reconstruction">
                    <h3>Rekonštrukcie bytov a domov</h3>
                    <p>Komplexné renovácie interiérov a exteriérov</p>
                    <span class="service-card__hint">Kliknutím zobraziť túto kategóriu</span>
                </div>
                <div class="service-card" data-filter="facade">
                    <h3>Fasády a zateplenie</h3>
                    <p>Moderné fasádne systémy a tepelné izolácie</p>
                    <span class="service-card__hint">Kliknutím zobraziť túto kategóriu</span>
                </div>
                <div class="service-card" data-filter="tiles">
                    <h3>Obklady a dlažby</h3>
                    <p>Profesionálne obkladanie a dlaženie všetkých priestorov</p>
                    <span class="service-card__hint">Kliknutím zobraziť túto kategóriu</span>
                </div>
                <div class="service-card" data-filter="roof">
                    <h3>Strechy a sadrokartón</h3>
                    <p>Komplexné strešné práce a sadrokartónové konštrukcie</p>
                    <span class="service-card__hint">Kliknutím zobraziť túto kategóriu</span>
                </div>
                <div class="service-card" data-filter="bathroom_kitchen">
                    <h3>Kúpeľne a kuchyne na mieru</h3>
                    <p>Dizajn a realizácia kúpeľní a kuchýň presne podľa vašich predstáv</p>
                    <span class="service-card__hint">Kliknutím zobraziť túto kategóriu</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Our Works Section -->
    <section class="works" id="works">
        <div class="container">
            <h2 class="section-title">Naše práce</h2>
            <div class="works__grid" id="worksGrid">
                <!-- Project cards will be inserted here by JavaScript -->
            </div>
            <div class="works__actions">
                <button class="btn btn--secondary" id="loadMoreBtn" onclick="loadMoreProjects()">
                    Načítať ďalšie projekty
                </button>
            </div>
        </div>
    </section>

    <!-- Team Section -->
    <section class="team" id="team">
        <div class="container">
            <h2 class="section-title">Náš tím</h2>

            <!-- Team Banner -->
<!--            <div class="team__banner">-->
<!--                <img src="images/team-banner.jpg" alt="Tím StavMaster na stavbe" loading="lazy" width="1200" height="400">-->
<!--            </div>-->

            <!-- Team Members -->
            <div class="team__grid">
                <article class="team-card">
                    <img src="images/team-member-1.jpg" alt="Anatolij Porokhnavets" loading="lazy" width="300" height="300">
                    <div class="team-card__content">
                        <h3 class="team-card__name">Anatolij Porokhnavets</h3>
                        <p class="team-card__role">Zakladateľ a vedúci projektov, konateľ</p>
                        <p class="team-card__experience">S viac ako 15 rokmi skúseností v rekonštrukciách domov vedie tím s dôrazom na kvalitu, detaily a spoľahlivosť.</p>
                    </div>
                </article>

                <article class="team-card">
                    <img src="images/team-member-2.jpg" alt="Mihajlo Kovač" loading="lazy" width="300" height="300">
                    <div class="team-card__content">
                        <h3 class="team-card__name">Mihajlo Kovač</h3>
                        <p class="team-card__role">Spoluzakladateľ a hlavný inžinier, konateľ</p>
                        <p class="team-card__experience">Má 20 rokov praxe v projektovaní a stavebnom dozore, špecializuje sa na modernizáciu starších budov a technické riešenia.</p> </div>
                </article>

                <article class="team-card">
                    <img src="images/team-member-3.jpg" alt="Oleksandr Zmenytko" loading="lazy" width="300" height="300">
                    <div class="team-card__content">
                        <h3 class="team-card__name">Oleksandr Zmenytko</h3>
                        <p class="team-card__role">Obkladac</p>
                        <p class="team-card__experience">8 rokov sa venuje precíznej práci s obkladmi a detailom interiérov. Pomáha meniť priestory na funkčné a estetické domovy.</p>
                    </div>
                </article>
            </div>
        </div>
    </section>

    <!-- Pricing Process Section -->
    <section class="pricing" id="pricing">
        <div class="container">
            <h2 class="section-title">Ako sa formuje cena</h2>
            <div class="pricing__steps">
                <div class="pricing-step">
                    <div class="pricing-step__number">1</div>
                    <div class="pricing-step__content">
                        <h3 class="pricing-step__title">Požiadavka</h3>
                        <p class="pricing-step__description">Pošlete nám požiadavku cez web alebo nás zavolajte. Prediskutujeme vaše želania a požiadavky na projekt.</p>
                    </div>
                </div>

                <div class="pricing-step">
                    <div class="pricing-step__number">2</div>
                    <div class="pricing-step__content">
                        <h3 class="pricing-step__title">Výjazd a zameranie</h3>
                        <p class="pricing-step__description">Náš špecialista príde na objekt, vykoná zameranie a technické posúdenie budúcich prác.</p>
                    </div>
                </div>

                <div class="pricing-step">
                    <div class="pricing-step__number">3</div>
                    <div class="pricing-step__content">
                        <h3 class="pricing-step__title">Rozpočet a zmluva</h3>
                        <p class="pricing-step__description">Pripravíme detailný rozpočet s uvedením všetkých materiálov a prác. Uzatvoríme zmluvu s fixnou cenou.</p>
                    </div>
                </div>

                <div class="pricing-step">
                    <div class="pricing-step__number">4</div>
                    <div class="pricing-step__content">
                        <h3 class="pricing-step__title">Práca a prevzatie</h3>
                        <p class="pricing-step__description">Vykonáme práce podľa zmluvy a technológií. Odovzdáme objekt s preberacím protokolom a zárukou.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Reviews Section -->
    <section class="reviews" id="reviews">
        <div class="container">
            <h2 class="section-title">Recenzie klientov</h2>
            <div class="reviews__container">
                <div class="reviews__track" id="reviewsTrack">
                    <article class="review-card">
                        <div class="review-card__header">
                            <div class="review-card__info">
                                <h3 class="review-card__name">Mária Kováč</h3>
                                <div class="review-card__rating" aria-label="5 hviezdičiek z 5">
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                </div>
                            </div>
                        </div>
                        <p class="review-card__text">
                            "Vynikajúca práca! Chlapci kompletne zrekonštruovali náš byt včas. Kvalita na dobrej úrovni, všetko urobené starostlivo a profesionálne. Určite odporúčame!"
                        </p>
                    </article>

                    <article class="review-card">
                        <div class="review-card__header">
                            <div class="review-card__info">
                                <h3 class="review-card__name">Ján Šimko</h3>
                                <div class="review-card__rating" aria-label="5 hviezdičiek z 5">
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                </div>
                            </div>
                        </div>
                        <p class="review-card__text">
                            "Stavali sme dom od základov. Veľmi spokojní s výsledkom! Tím profesionálny, vždy na spojení, splnili všetko včas. Odporúčam!"
                        </p>
                    </article>

                    <article class="review-card">
                        <div class="review-card__header">
                            <div class="review-card__info">
                                <h3 class="review-card__name">Katarína Čierna</h3>
                                <div class="review-card__rating" aria-label="4 hviezdičky z 5">
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star star--empty">☆</span>
                                </div>
                            </div>
                        </div>
                        <p class="review-card__text">
                            "Robili rekonštrukciu kancelárie. Profesionálna práca od začiatku až do konca. Celkovo spokojná s výsledkom."
                        </p>
                    </article>

                    <article class="review-card">
                        <div class="review-card__header">
                            <div class="review-card__info">
                                <h3 class="review-card__name">Petra Novotná</h3>
                                <div class="review-card__rating" aria-label="5 hviezdičiek z 5">
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                </div>
                            </div>
                        </div>
                        <p class="review-card__text">
                            "Spoľahlivý tím, všetko bolo dokončené načas a s veľkým dôrazom na detaily."
                        </p>
                    </article>

                    <article class="review-card">
                        <div class="review-card__header">
                            <div class="review-card__info">
                                <h3 class="review-card__name">Martin Horák</h3>
                                <div class="review-card__rating" aria-label="5 hviezdičiek z 5">
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                </div>
                            </div>
                        </div>
                        <p class="review-card__text">
                            "Spoľahlivý tím, všetko bolo dokončené načas a s veľkým dôrazom na detaily."
                        </p>
                    </article>

<!--                    <article class="review-card">-->
<!--                        <div class="review-card__header">-->
<!--                            <div class="review-card__info">-->
<!--                                <h3 class="review-card__name">Lucia Varga</h3>-->
<!--                                <div class="review-card__rating" aria-label="5 hviezdičiek z 5">-->
<!--                                    <span class="star">★</span>-->
<!--                                    <span class="star">★</span>-->
<!--                                    <span class="star">★</span>-->
<!--                                    <span class="star">★</span>-->
<!--                                    <span class="star">★</span>-->
<!--                                </div>-->
<!--                            </div>-->
<!--                        </div>-->
<!--                        <p class="review-card__text">-->
<!--                            "Konečne sme našli spoľahlivých stavbárov! Práca bola hotová presne podľa plánu a cena zodpovedala dohode."-->
<!--                        </p>-->
<!--                    </article>-->
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact" id="contact">
        <div class="container">
            <h2 class="section-title">Poslať požiadavku</h2>
            <div class="contact__content">
                <div class="contact__info">
                    <h3>Spojte sa s nami pohodlným způsobom</h3>
                    <p>Pošlete požiadavku a získajte bezplatnú konzultáciu a rozpočet do 24 hodín.</p>

                    <div class="contact__methods">
                        <div class="contact-method">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                            </svg>
                            <div>
                                <span>Telefón</span>
                                <a href="tel:+421950405659">+421 950 405 659</a>
                            </div>
                        </div>

                        <div class="contact-method">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            <div>
                                <span>Email</span>
                                <a href="mailto:ukstav.sk@gmail.com">ukstav.sk@gmail.com</a>
                            </div>
                        </div>

                        <div class="contact-method">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            <div>
                                <span>Adresa</span>
                                <p>Bratislava & okolie</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form class="contact-form" id="contactForm" novalidate>
                    <div class="form-group">
                        <label for="name" class="form-label">Meno *</label>
                        <input type="text" id="name" name="name" class="form-input" required aria-describedby="name-error">
                        <div class="error-message" id="name-error" role="alert"></div>
                    </div>

                    <div class="form-group">
                        <label for="phone" class="form-label">Telefón *</label>
                        <input type="tel" id="phone" name="phone" class="form-input" required aria-describedby="phone-error" placeholder="+421 950 000 000">
                        <div class="error-message" id="phone-error" role="alert"></div>
                    </div>

                    <div class="form-group">
                        <label for="description" class="form-label">Krátky popis projektu</label>
                        <textarea id="description" name="description" class="form-input" rows="4" aria-describedby="description-error" placeholder="Popíšte nám váš projekt..."></textarea>
                        <div class="error-message" id="description-error" role="alert"></div>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="consent" name="consent" required aria-describedby="consent-error">
                            <span class="checkbox-custom"></span>
                            Súhlasím so spracovaním osobných údajov *
                        </label>
                        <div class="error-message" id="consent-error" role="alert"></div>
                    </div>

                    <button type="submit" class="btn btn--primary btn--large btn--full-width">
                        Poslať požiadavku
                    </button>
                </form>
            </div>
        </div>
    </section>
</main>

<!-- Footer -->
<footer class="footer" role="contentinfo">
    <div class="container">
        <div class="footer__content">
            <div class="footer__info">
<!--                <div class="footer__logo">-->
<!--                    <img src="images/logo.svg" alt="StavMaster" width="140" height="40">-->
<!--                </div>-->
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

<!--            <div class="footer__legal">-->
<!--                <h3>Dokumenty</h3>-->
<!--                <ul class="footer__links">-->
<!--                    <li><a href="/privacy">Ochrana osobných údajov</a></li>-->
<!--                    <li><a href="/terms">Podmienky používania</a></li>-->
<!--                    <li><a href="/certificates">Certifikáty</a></li>-->
<!--                </ul>-->
<!--            </div>-->

            <div class="footer__social">
                <h3>Sociálne siete</h3>
                <div class="social-links">
                    <a href="https://wa.me/421950405659" class="social-link" aria-label="WhatsApp" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.488"/>
                        </svg>
                    </a>
<!--                    <a href="https://t.me/stavmastersk" class="social-link" aria-label="Telegram" target="_blank" rel="noopener">-->
<!--                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">-->
<!--                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>-->
<!--                        </svg>-->
<!--                    </a>-->
                    <a href="https://facebook.com/profile.php?id=61565539918906&mibextid=LQQJ4d" class="social-link" aria-label="Facebook" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                    <a href="https://instagram.com/uk_stav/" class="social-link" aria-label="Instagram" target="_blank" rel="noopener">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>

        <div class="footer__bottom">
            <p>&copy; 2025 UKStav. Všetky práva vyhradené.</p>
            <p>IČO: 57 177 945</p>
            <p>DIČ: 2122 589 9974</p>
        </div>
    </div>
</footer>

<!-- Contact Modal -->
<div class="modal" id="contactModal" role="dialog" aria-labelledby="modalTitle" aria-hidden="true">
    <div class="modal__backdrop" onclick="closeContactModal()"></div>
    <div class="modal__content">
        <div class="modal__header">
            <h3 id="modalTitle">Zanechať číslo</h3>
            <button class="modal__close" onclick="closeContactModal()" aria-label="Zavrieť">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
        <form class="modal__form" id="quickContactForm">
            <div class="form-group">
                <label for="quickName" class="form-label">Meno *</label>
                <input type="text" id="quickName" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="quickPhone" class="form-label">Telefón *</label>
                <input type="tel" id="quickPhone" name="phone" class="form-input" required placeholder="+421 950 000 000">
            </div>

            <!-- Callback time section -->
            <div class="form-group">
                <label for="quickCallbackTime" class="form-label">Kedy vás môžeme zavolať? (nepovinné)</label>
                <input type="time" id="quickCallbackTime" name="callback_time" class="form-input" placeholder="13:00">
            </div>

            <button type="submit" class="btn btn--primary btn--full-width">
                Poslať
            </button>
        </form>
    </div>
</div>

<!-- Success Modal -->
<div class="modal" id="successModal" role="dialog" aria-labelledby="successTitle" aria-hidden="true">
    <div class="modal__backdrop" onclick="closeSuccessModal()"></div>
    <div class="modal__content">
        <div class="modal__header">
            <h3 id="successTitle">Ďakujeme za požiadavku!</h3>
            <button class="modal__close" onclick="closeSuccessModal()" aria-label="Zavrieť">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
        <div class="modal__body">
            <p id="successMessage">Vaša požiadavka bola prijatá! Spojíme sa s vami do 2 hodín pre upresnenie detailov a dohodnutie stretnutia.</p>
            <button class="btn btn--primary" onclick="closeSuccessModal()">
                Rozumiem
            </button>
        </div>
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