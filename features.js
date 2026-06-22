const FEATURES = [
  {
    product: "m3pixel",
    tab: "m3Pixel",
    title: "m3Pixel",
    copy: "See live traffic and performance across your Make Me Modern properties in one place.",
    tone: "pixel",
    ctaLabel: "Visit m3Pixel",
    ctaUrl: "https://m3pixel.com/",
  },
  {
    product: "m3send",
    tab: "m3Send",
    title: "m3Send",
    copy: "Send encrypted files and messages to your Make Me Modern team without leaving the portal.",
    tone: "send",
    ctaLabel: "Visit m3Send",
    ctaUrl: "https://m3send.com/",
  },
  {
    product: "ads",
    tab: "Ads",
    title: "Ads",
    copy: "In-house Google Ads optimization that turns flat campaigns into high-performing placements.",
    tone: "ads",
    ctaLabel: "Explore Ads",
    ctaUrl: "https://makememodern.com/",
  },
  {
    product: "llm",
    tab: "your personal M3 assistant",
    title: "your personal M3 assistant",
    copy: "Instant answers about your account.",
    hero: "m3llm",
    tone: "llm",
    ctaLabel: "Open assistant",
    ctaUrl: "https://makememodern.com/",
  },
];

function accordionHeroMarkup(feature) {
  if (feature.placeholder) {
    return `<div class="accordion-panel__hero accordion-panel__hero--placeholder" aria-hidden="true"></div>`;
  }
  if (!feature.hero) return "";
  return `<div class="accordion-panel__hero" data-hero="${feature.hero}"></div>`;
}

function panelHeroMarkup(feature) {
  if (feature.placeholder) {
    return `<div class="color-panel__hero color-panel__hero--placeholder" aria-hidden="true"></div>`;
  }
  if (!feature.hero) return "";
  return `<div class="color-panel__hero" data-hero="${feature.hero}"></div>`;
}

function ctaMarkup(feature) {
  if (!feature.ctaUrl) return "";
  return `<a class="feature-cta" href="${feature.ctaUrl}" target="_blank" rel="noopener noreferrer">${feature.ctaLabel}</a>`;
}

function accordionCard(feature, index, isActive) {
  return `
    <article class="accordion-panel${isActive ? " is-active" : ""}" data-product="${feature.product}">
      <div class="accordion-panel__bg"></div>
      ${accordionHeroMarkup(feature)}
      <div class="accordion-panel__tab">${feature.tab}</div>
      <div class="accordion-panel__overlay">
        <div class="accordion-panel__content">
          <h2 class="feature-title">${feature.title}</h2>
          <p class="feature-copy">${feature.copy}</p>
          ${ctaMarkup(feature)}
        </div>
      </div>
    </article>
  `;
}

function panelCard(feature, index, isActive) {
  return `
    <article class="color-panel${isActive ? " is-active" : ""}" data-product="${feature.product}" data-tone="${feature.tone}">
      <div class="color-panel__surface">
        ${panelHeroMarkup(feature)}
        <div class="color-panel__overlay">
          <span class="color-panel__label">${feature.tab}</span>
          <div class="color-panel__body">
            <h2 class="feature-title">${feature.title}</h2>
            <p class="feature-copy">${feature.copy}</p>
            ${ctaMarkup(feature)}
          </div>
        </div>
      </div>
    </article>
  `;
}

function carouselHeroMarkup(feature) {
  if (feature.placeholder) {
    return `<div class="carousel-slide__hero carousel-slide__hero--placeholder" aria-hidden="true"></div>`;
  }
  if (!feature.hero) return "";
  return `<div class="carousel-slide__hero" data-hero="${feature.hero}"></div>`;
}

function carouselSlide(feature, index, isActive) {
  return `
    <article
      class="carousel-slide${isActive ? " is-active" : ""}"
      data-product="${feature.product}"
      data-tone="${feature.tone}"
      aria-hidden="${isActive ? "false" : "true"}"
    >
      <div class="carousel-slide__bg"></div>
      ${carouselHeroMarkup(feature)}
      <div class="carousel-slide__overlay">
        <div class="carousel-slide__content">
          <h2 class="feature-title">${feature.title}</h2>
          <p class="feature-copy">${feature.copy}</p>
          ${ctaMarkup(feature)}
        </div>
      </div>
    </article>
  `;
}

function carouselPagination(index, feature, isActive) {
  return `
    <button
      class="carousel-showcase__dot${isActive ? " is-active" : ""}"
      type="button"
      role="tab"
      aria-selected="${isActive ? "true" : "false"}"
      aria-label="Go to slide ${index + 1}: ${feature.title}"
      data-slide-index="${index}"
    ></button>
  `;
}

function renderAccordionShowcase(root) {
  const cards = FEATURES.map((feature, index) => accordionCard(feature, index, index === 0)).join("");
  const isHorizontal = root.classList.contains("accordion-showcase--horizontal");

  if (isHorizontal) {
    root.innerHTML = `
      <header class="accordion-showcase__header">
        <h2 class="accordion-showcase__title">
          What's New With <span class="accordion-showcase__title-accent">m3</span>?
        </h2>
      </header>
      <div class="accordion-showcase__panels">${cards}</div>
    `;
    return;
  }

  root.innerHTML = cards;
}

function renderCarouselShowcase(root) {
  const slides = FEATURES.map((feature, index) => carouselSlide(feature, index, index === 0)).join("");
  const dots = FEATURES.map((feature, index) => carouselPagination(index, feature, index === 0)).join("");

  root.innerHTML = `
    <div class="carousel-showcase__viewport" aria-live="polite">
      <div class="carousel-showcase__track">${slides}</div>
      <header class="carousel-showcase__header">
        <h2 class="carousel-showcase__title">
          What's New With <span class="carousel-showcase__title-accent">m3</span>?
        </h2>
      </header>
      <footer class="carousel-showcase__controls">
        <button class="carousel-showcase__arrow carousel-showcase__arrow--prev" type="button" aria-label="Previous slide">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <div class="carousel-showcase__pagination" role="tablist" aria-label="Carousel slides">${dots}</div>
        <button class="carousel-showcase__arrow carousel-showcase__arrow--next" type="button" aria-label="Next slide">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </button>
      </footer>
    </div>
  `;
}

function renderShowcases() {
  document.querySelectorAll("[data-render='accordion']").forEach((root) => {
    renderAccordionShowcase(root);
  });

  document.querySelectorAll("[data-render='panels']").forEach((root) => {
    root.innerHTML = FEATURES.map((feature, index) => panelCard(feature, index, index === 0)).join("");
  });

  document.querySelectorAll("[data-render='carousel']").forEach((root) => {
    renderCarouselShowcase(root);
  });
}

renderShowcases();
