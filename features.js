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
    hero: "m3ads",
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
  {
    product: "marketing",
    tab: "Marketing",
    title: "Marketing",
    copy: "Access campaigns and results tied to the marketing already running on your account.",
    hero: "m3marketing",
    tone: "amber",
    ctaLabel: "Explore marketing",
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

function renderShowcases() {
  document.querySelectorAll("[data-render='accordion']").forEach((root) => {
    renderAccordionShowcase(root);
  });

  document.querySelectorAll("[data-render='panels']").forEach((root) => {
    root.innerHTML = FEATURES.map((feature, index) => panelCard(feature, index, index === 0)).join("");
  });
}

renderShowcases();
