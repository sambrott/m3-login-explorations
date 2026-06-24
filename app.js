const approaches = document.querySelectorAll(".approach");
const navButtons = document.querySelectorAll(".approach-nav-panel__btn");
const navFloat = document.querySelector(".approach-nav-float");
const navToggle = document.querySelector(".approach-nav-float__toggle");
const navPanel = document.getElementById("approach-nav-panel");
const navCurrent = document.querySelector(".approach-nav-float__current");

const cyclers = new Map();
let activeApproach = null;
let approachTransitionTimer = null;
const APPROACH_DURATION = 650;

function setNavOpen(isOpen) {
  navFloat.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute(
    "aria-label",
    isOpen ? "Close layout explorations menu" : "Open layout explorations menu"
  );
  navPanel.setAttribute("aria-hidden", String(!isOpen));
}

navToggle.addEventListener("click", () => {
  setNavOpen(!navFloat.classList.contains("is-open"));
});

document.addEventListener("click", (event) => {
  if (!navFloat.classList.contains("is-open")) return;
  if (!navFloat.contains(event.target)) setNavOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navFloat.classList.contains("is-open")) {
    setNavOpen(false);
    navToggle.focus();
  }
});

function updateNavLabel(label) {
  navCurrent.classList.add("is-fading");
  window.setTimeout(() => {
    navCurrent.textContent = label;
    navCurrent.classList.remove("is-fading");
  }, 120);
}

function activateApproach(target) {
  if (target === activeApproach) return;

  const outgoing = document.getElementById(`approach-${activeApproach}`);
  const incoming = document.getElementById(`approach-${target}`);
  if (!incoming) return;

  navButtons.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.approach === target);
  });

  clearTimeout(approachTransitionTimer);

  if (outgoing && outgoing !== incoming) {
    outgoing.classList.remove("is-active");
    outgoing.classList.add("is-previous");
    cyclers.get(outgoing.id)?.stop();

    incoming.classList.add("is-active");
    cyclers.get(incoming.id)?.start();

    approachTransitionTimer = window.setTimeout(() => {
      outgoing.classList.remove("is-previous");
    }, APPROACH_DURATION);
  } else {
    incoming.classList.add("is-active");
    cyclers.get(incoming.id)?.start();
  }

  activeApproach = target;
  window.M3HeroEngine?.syncApproach(target);
  syncCarouselSplitControls(isCarouselApproach(target));
}

function isCarouselApproach(approach = activeApproach) {
  return approach === "carousel-left" || approach === "carousel-right";
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.approach;
    const label = button.querySelector("strong").textContent;

    activateApproach(target);
    updateNavLabel(label);
    setNavOpen(false);
  });
});

document.querySelectorAll(".field__toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.previousElementSibling;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "Hide" : "Show";
  });
});

function setupCyclingCards(root, itemSelector, interval = 4500) {
  const items = [...root.querySelectorAll(itemSelector)];
  if (!items.length) return null;

  let index = Math.max(
    0,
    items.findIndex((item) => item.classList.contains("is-active"))
  );
  let timer = null;
  let paused = false;
  let hoveredIndex = null;
  let resumeTimer = null;
  let activateTimer = null;

  function setActive(nextIndex) {
    const normalized = (nextIndex + items.length) % items.length;
    if (normalized === index) return;

    index = normalized;
    items.forEach((item, i) => item.classList.toggle("is-active", i === index));
    window.dispatchEvent(new CustomEvent("m3:cards-changed"));
  }

  function getIndex() {
    return index;
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (!document.body.classList.contains("is-auto-cycling")) return;
    if (document.body.classList.contains("is-animations-muted")) return;
    if (paused || hoveredIndex !== null) return;
    timer = setInterval(() => setActive(index + 1), interval);
  }

  function pause() {
    paused = true;
    stop();
  }

  function scheduleResume() {
    clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      if (root.matches(":hover") || hoveredIndex !== null) return;
      paused = false;
      start();
    }, 180);
  }

  function activateFromHover(nextIndex) {
    clearTimeout(activateTimer);
    activateTimer = window.setTimeout(() => {
      if (hoveredIndex !== nextIndex) return;
      setActive(nextIndex);
      pause();
    }, 170);
  }

  function resolveHoveredItem(target) {
    const item = target.closest(itemSelector);
    if (!item || !root.contains(item)) return null;
    return items.indexOf(item);
  }

  root.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    const nextIndex = resolveHoveredItem(event.target);
    if (nextIndex === null || nextIndex < 0) return;

    hoveredIndex = nextIndex;
    clearTimeout(resumeTimer);
    activateFromHover(nextIndex);
  });

  root.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const nextIndex = resolveHoveredItem(event.target);
    if (nextIndex === null || nextIndex < 0) return;
    if (nextIndex === hoveredIndex) return;

    hoveredIndex = nextIndex;
    clearTimeout(resumeTimer);
    activateFromHover(nextIndex);
  });

  root.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    if (root.contains(event.relatedTarget)) return;

    hoveredIndex = null;
    clearTimeout(activateTimer);
    scheduleResume();
  });

  items.forEach((item, i) => {
    item.addEventListener("focusin", () => {
      hoveredIndex = i;
      clearTimeout(resumeTimer);
      setActive(i);
      pause();
    });

    item.addEventListener("focusout", (event) => {
      if (root.contains(event.relatedTarget)) return;
      hoveredIndex = null;
      scheduleResume();
    });
  });

  return { setActive, getIndex, start, stop, pause, resume: scheduleResume };
}

function setupCarouselControls(root) {
  const approach = root.closest(".approach");
  if (!approach) return;

  const slides = [...root.querySelectorAll(".carousel-slide")];
  const prevBtn = root.querySelector(".carousel-showcase__arrow--prev");
  const nextBtn = root.querySelector(".carousel-showcase__arrow--next");
  const dots = [...root.querySelectorAll(".carousel-showcase__dot")];

  function syncCarouselUi() {
    const activeIndex = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains("is-active"))
    );

    slides.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", String(i !== activeIndex));
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === activeIndex);
      dot.setAttribute("aria-selected", String(i === activeIndex));
    });
  }

  function navigate(delta) {
    const cycler = cyclers.get(approach.id);
    if (!cycler) return;
    cycler.setActive(cycler.getIndex() + delta);
  }

  prevBtn?.addEventListener("click", () => navigate(-1));
  nextBtn?.addEventListener("click", () => navigate(1));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const cycler = cyclers.get(approach.id);
      if (!cycler) return;
      cycler.setActive(Number(dot.dataset.slideIndex));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!approach.classList.contains("is-active")) return;
    if (event.target.closest("input, textarea, select, button:not(.carousel-showcase__arrow):not(.carousel-showcase__dot)")) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    }
  });

  window.addEventListener("m3:cards-changed", () => {
    if (!approach.classList.contains("is-active")) return;
    syncCarouselUi();
  });

  syncCarouselUi();
}

document.querySelectorAll("[data-cycling]").forEach((root) => {
  const approach = root.closest(".approach");
  if (!approach) return;

  const cycler = setupCyclingCards(root, root.dataset.cycling, Number(root.dataset.interval) || 4500);
  if (cycler) cyclers.set(approach.id, cycler);
});

document.querySelectorAll("[data-render='carousel']").forEach((root) => {
  setupCarouselControls(root);
});

const frameToggle = document.querySelector(".frame-mode-toggle-switch");
const lightCardsToggle = document.querySelector(".light-cards-toggle-switch");
const activePanelDarkToggle = document.querySelector(".active-panel-dark-toggle-switch");
const activePanelDarkRow = document.querySelector(".active-panel-dark-toggle-row");
const autoCycleToggle = document.querySelector(".auto-cycle-toggle-switch");
const muteAnimationsToggle = document.querySelector(".mute-animations-toggle-switch");
const frameSizeSlider = document.getElementById("frame-size-slider");
const frameSizeValue = document.querySelector(".frame-size-value");
const frameInsetSlider = document.getElementById("frame-inset-slider");
const frameInsetValue = document.querySelector(".frame-inset-value");
const carouselSplitSlider = document.getElementById("carousel-split-slider");
const carouselSplitValue = document.querySelector(".carousel-split-value");
const copyConfigButton = document.querySelector(".approach-nav-panel__copy");

const FRAME_OUTER_MAX_PX = 160;
const FRAME_INSET_MAX_PX = 56;
const DEFAULT_FRAMED = true;
const DEFAULT_LIGHT_CARDS = true;
const DEFAULT_ACTIVE_PANEL_DARK = true;
const DEFAULT_AUTO_CYCLE = false;
const DEFAULT_ANIMATIONS_MUTED = false;
const DEFAULT_APPROACH = "carousel-right";
const DEFAULT_FRAME_SIZE_LEVEL = 4;
const DEFAULT_FRAME_INSET_LEVEL = 0;
const DEFAULT_CAROUSEL_SPLIT_LEVEL = 5;

function scheduleHeroResize() {
  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 350);
}

function getFrameSizeLevel() {
  return Math.max(0, Math.min(10, Number(frameSizeSlider?.value) || 0));
}

function getFrameSizePx(level = getFrameSizeLevel()) {
  return Math.round((level / 10) * FRAME_OUTER_MAX_PX * 10) / 10;
}

function applyFrameSize(level) {
  const resolved = Math.max(0, Math.min(10, Number(level) || 0));
  const px = getFrameSizePx(resolved);
  document.documentElement.style.setProperty("--frame-outer-user", `${px}px`);
  frameSizeSlider?.setAttribute("aria-valuenow", String(resolved));
  frameSizeValue.textContent = String(resolved);
  scheduleHeroResize();
}

function getFrameInsetLevel() {
  return Math.max(0, Math.min(10, Number(frameInsetSlider?.value) || 0));
}

function getFrameInsetPx(level = getFrameInsetLevel()) {
  return Math.round((level / 10) * FRAME_INSET_MAX_PX * 10) / 10;
}

function applyFrameInset(level) {
  const resolved = Math.max(0, Math.min(10, Number(level) || 0));
  const px = getFrameInsetPx(resolved);
  document.documentElement.style.setProperty("--frame-inner-user", `${px}px`);
  frameInsetSlider?.setAttribute("aria-valuenow", String(resolved));
  frameInsetValue.textContent = String(resolved);
  scheduleHeroResize();
}

function getCarouselSplitLevel() {
  return Math.max(0, Math.min(10, Number(carouselSplitSlider?.value) || 0));
}

function getCarouselSplitShares(level = getCarouselSplitLevel()) {
  const resolved = Math.max(0, Math.min(10, Number(level) || 0));
  const showcaseShare = 33.3333 + (resolved / 10) * 33.3334;
  const loginShare = 100 - showcaseShare;

  return {
    showcaseShare: Math.round(showcaseShare * 1000) / 1000,
    loginShare: Math.round(loginShare * 1000) / 1000,
  };
}

function applyCarouselSplit(level) {
  const resolved = Math.max(0, Math.min(10, Number(level) || 0));
  const { showcaseShare, loginShare } = getCarouselSplitShares(resolved);
  const gridColumns = `minmax(0, ${loginShare}%) minmax(0, ${showcaseShare}%)`;
  const gridColumnsRight = `minmax(0, ${showcaseShare}%) minmax(0, ${loginShare}%)`;

  document.documentElement.style.setProperty("--carousel-showcase-share", `${showcaseShare}%`);
  document.documentElement.style.setProperty("--carousel-login-share", `${loginShare}%`);
  document.documentElement.style.setProperty("--carousel-grid-columns", gridColumns);
  document.documentElement.style.setProperty("--carousel-grid-columns-right", gridColumnsRight);
  carouselSplitSlider?.setAttribute("aria-valuenow", String(resolved));
  if (carouselSplitValue) carouselSplitValue.textContent = String(resolved);
  scheduleHeroResize();
}

function syncCarouselSplitControls(isCarousel = isCarouselApproach()) {
  document.querySelectorAll(".carousel-split-controls").forEach((element) => {
    element.hidden = !isCarousel;
  });
  carouselSplitSlider?.toggleAttribute("disabled", !isCarousel);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
}

function showCopyFeedback(button) {
  if (!button) return;

  const original = button.textContent;
  button.textContent = "Copied!";
  button.classList.add("is-copied");
  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("is-copied");
  }, 1600);
}

function buildExplorationConfig() {
  const sizeLevel = getFrameSizeLevel();
  const sizePx = getFrameSizePx(sizeLevel);
  const insetLevel = getFrameInsetLevel();
  const insetPx = getFrameInsetPx(insetLevel);
  const carouselSplitLevel = getCarouselSplitLevel();
  const carouselSplit = getCarouselSplitShares(carouselSplitLevel);
  const isFramed = document.body.classList.contains("is-framed");
  const lightCards = document.body.classList.contains("is-light-cards");
  const activePanelDark = document.body.classList.contains("is-active-panel-dark");
  const autoCycle = document.body.classList.contains("is-auto-cycling");
  const animationsMuted = document.body.classList.contains("is-animations-muted");
  const activeButton = document.querySelector(".approach-nav-panel__btn.is-active");
  const approachLabel = activeButton?.querySelector("strong")?.textContent?.trim() ?? activeApproach;

  return {
    approach: activeApproach,
    approachLabel,
    framed: isFramed,
    lightCards,
    activePanelDark,
    autoCycle,
    animationsMuted,
    frameSize: {
      level: sizeLevel,
      px: sizePx,
      maxPx: FRAME_OUTER_MAX_PX,
    },
    cardInset: {
      level: insetLevel,
      px: insetPx,
      maxPx: FRAME_INSET_MAX_PX,
    },
    carouselSplit: {
      level: carouselSplitLevel,
      showcaseShare: carouselSplit.showcaseShare,
      loginShare: carouselSplit.loginShare,
    },
    cssVariables: {
      "--frame-outer-user": `${sizePx}px`,
      "--frame-inner-user": `${insetPx}px`,
      "--carousel-showcase-share": `${carouselSplit.showcaseShare}%`,
      "--carousel-login-share": `${carouselSplit.loginShare}%`,
      "--carousel-grid-columns": `minmax(0, ${carouselSplit.loginShare}%) minmax(0, ${carouselSplit.showcaseShare}%)`,
      "--carousel-grid-columns-right": `minmax(0, ${carouselSplit.showcaseShare}%) minmax(0, ${carouselSplit.loginShare}%)`,
      "--frame-inner-radius": "1.25rem",
      "--frame-radius": "1.75rem",
      "--approach-dot-size": "10px",
    },
    classes: {
      body: [
        ...(isFramed ? ["is-framed"] : []),
        ...(lightCards ? ["is-light-cards"] : []),
        ...(activePanelDark ? ["is-active-panel-dark"] : []),
        ...(autoCycle ? ["is-auto-cycling"] : []),
        ...(animationsMuted ? ["is-animations-muted"] : []),
      ],
    },
  };
}

function formatExplorationConfig(config) {
  const cssBlock = `:root {
  --frame-outer-user: ${config.cssVariables["--frame-outer-user"]};
  --frame-inner-user: ${config.cssVariables["--frame-inner-user"]};
  --carousel-showcase-share: ${config.cssVariables["--carousel-showcase-share"]};
  --carousel-login-share: ${config.cssVariables["--carousel-login-share"]};
  --carousel-grid-columns: ${config.cssVariables["--carousel-grid-columns"]};
  --carousel-grid-columns-right: ${config.cssVariables["--carousel-grid-columns-right"]};
  --frame-inner-radius: ${config.cssVariables["--frame-inner-radius"]};
  --frame-radius: ${config.cssVariables["--frame-radius"]};
  --approach-dot-size: ${config.cssVariables["--approach-dot-size"]};
}`;

  const jsBlock = `// Layout
activateApproach("${config.approach}");
document.body.classList.toggle("is-framed", ${config.framed});
document.body.classList.toggle("is-light-cards", ${config.lightCards});
document.body.classList.toggle("is-active-panel-dark", ${config.activePanelDark});
document.body.classList.toggle("is-auto-cycling", ${config.autoCycle});
document.body.classList.toggle("is-animations-muted", ${config.animationsMuted});
applyFrameSize(${config.frameSize.level});
applyFrameInset(${config.cardInset.level});
applyCarouselSplit(${config.carouselSplit.level});

// Or set directly:
document.documentElement.style.setProperty("--frame-outer-user", "${config.cssVariables["--frame-outer-user"]}");
document.documentElement.style.setProperty("--frame-inner-user", "${config.cssVariables["--frame-inner-user"]}");
document.documentElement.style.setProperty("--carousel-showcase-share", "${config.cssVariables["--carousel-showcase-share"]}");
document.documentElement.style.setProperty("--carousel-login-share", "${config.cssVariables["--carousel-login-share"]}");
document.documentElement.style.setProperty("--carousel-grid-columns", "${config.cssVariables["--carousel-grid-columns"]}");
document.documentElement.style.setProperty("--carousel-grid-columns-right", "${config.cssVariables["--carousel-grid-columns-right"]}");`;

  return `# M3 Login Explorations — copied settings

approach: ${config.approach}
approachLabel: ${config.approachLabel}
framed: ${config.framed}
lightCards: ${config.lightCards}
activePanelDark: ${config.activePanelDark}
autoCycle: ${config.autoCycle}
animationsMuted: ${config.animationsMuted}
frameSize.level: ${config.frameSize.level}
frameSize.px: ${config.frameSize.px}
cardInset.level: ${config.cardInset.level}
cardInset.px: ${config.cardInset.px}
carouselSplit.level: ${config.carouselSplit.level}
carouselSplit.showcaseShare: ${config.carouselSplit.showcaseShare}
carouselSplit.loginShare: ${config.carouselSplit.loginShare}

${cssBlock}

${jsBlock}

${JSON.stringify(config, null, 2)}`;
}

async function copyExplorationConfig() {
  await copyText(formatExplorationConfig(buildExplorationConfig()));
  showCopyFeedback(copyConfigButton);
}

function syncFrameControls(isFramed = document.body.classList.contains("is-framed")) {
  document.querySelectorAll(".frame-inset-row").forEach((row) => {
    row.hidden = !isFramed;
  });
  frameSizeSlider?.toggleAttribute("disabled", !isFramed);
  frameInsetSlider?.toggleAttribute("disabled", !isFramed);
}

function syncLightCards(isLight = document.body.classList.contains("is-light-cards")) {
  lightCardsToggle?.setAttribute("aria-pressed", String(isLight));
  syncActivePanelDark();
}

function syncActivePanelDark(isOn = document.body.classList.contains("is-active-panel-dark")) {
  const lightCards = document.body.classList.contains("is-light-cards");
  activePanelDarkRow?.toggleAttribute("hidden", !lightCards);
  activePanelDarkToggle?.toggleAttribute("disabled", !lightCards);
  if (!lightCards) return;
  activePanelDarkToggle?.setAttribute("aria-pressed", String(isOn));
}

function syncAutoCycle(isOn = document.body.classList.contains("is-auto-cycling")) {
  autoCycleToggle?.setAttribute("aria-pressed", String(isOn));
  cyclers.forEach((cycler, approachId) => {
    const approach = document.getElementById(approachId);
    if (!approach?.classList.contains("is-active")) return;
    if (isOn && !document.body.classList.contains("is-animations-muted")) cycler.start();
    else cycler.stop();
  });
}

function syncAnimationsMuted(isMuted = document.body.classList.contains("is-animations-muted")) {
  muteAnimationsToggle?.setAttribute("aria-pressed", String(isMuted));
  window.M3HeroEngine?.syncAnimationsMuted?.(isMuted);
  if (isMuted) {
    cyclers.forEach((cycler) => cycler.stop());
  } else {
    syncAutoCycle();
  }
}

frameToggle?.addEventListener("click", () => {
  const isOn = document.body.classList.toggle("is-framed");
  frameToggle.setAttribute("aria-pressed", String(isOn));
  syncFrameControls(isOn);
  scheduleHeroResize();
});

lightCardsToggle?.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("is-light-cards");
  lightCardsToggle.setAttribute("aria-pressed", String(isLight));
  syncActivePanelDark();
  scheduleHeroResize();
});

activePanelDarkToggle?.addEventListener("click", () => {
  if (!document.body.classList.contains("is-light-cards")) return;
  const isOn = document.body.classList.toggle("is-active-panel-dark");
  syncActivePanelDark(isOn);
  scheduleHeroResize();
});

autoCycleToggle?.addEventListener("click", () => {
  const isOn = document.body.classList.toggle("is-auto-cycling");
  syncAutoCycle(isOn);
});

muteAnimationsToggle?.addEventListener("click", () => {
  const isMuted = document.body.classList.toggle("is-animations-muted");
  syncAnimationsMuted(isMuted);
});

frameSizeSlider?.addEventListener("input", (event) => {
  applyFrameSize(event.target.value);
});

frameInsetSlider?.addEventListener("input", (event) => {
  applyFrameInset(event.target.value);
});

carouselSplitSlider?.addEventListener("input", (event) => {
  applyCarouselSplit(event.target.value);
});

copyConfigButton?.addEventListener("click", copyExplorationConfig);

if (DEFAULT_FRAMED) {
  document.body.classList.add("is-framed");
  frameToggle?.setAttribute("aria-pressed", "true");
}

if (DEFAULT_LIGHT_CARDS) {
  document.body.classList.add("is-light-cards");
  lightCardsToggle?.setAttribute("aria-pressed", "true");
}

if (DEFAULT_ACTIVE_PANEL_DARK) {
  document.body.classList.add("is-active-panel-dark");
  activePanelDarkToggle?.setAttribute("aria-pressed", "true");
}

if (DEFAULT_AUTO_CYCLE) {
  document.body.classList.add("is-auto-cycling");
  autoCycleToggle?.setAttribute("aria-pressed", "true");
}

if (DEFAULT_ANIMATIONS_MUTED) {
  document.body.classList.add("is-animations-muted");
  muteAnimationsToggle?.setAttribute("aria-pressed", "true");
}

syncFrameControls(DEFAULT_FRAMED);
syncLightCards(DEFAULT_LIGHT_CARDS);
syncActivePanelDark(DEFAULT_ACTIVE_PANEL_DARK);
syncAutoCycle(DEFAULT_AUTO_CYCLE);
syncAnimationsMuted(DEFAULT_ANIMATIONS_MUTED);

applyFrameSize(frameSizeSlider?.value ?? DEFAULT_FRAME_SIZE_LEVEL);
applyFrameInset(frameInsetSlider?.value ?? DEFAULT_FRAME_INSET_LEVEL);
applyCarouselSplit(carouselSplitSlider?.value ?? DEFAULT_CAROUSEL_SPLIT_LEVEL);
syncCarouselSplitControls(isCarouselApproach(DEFAULT_APPROACH));

window.addEventListener("resize", scheduleHeroResize, { passive: true });
window.addEventListener("orientationchange", scheduleHeroResize, { passive: true });

activateApproach(DEFAULT_APPROACH);

const defaultNavButton = document.querySelector(`[data-approach="${DEFAULT_APPROACH}"]`);
if (defaultNavButton) {
  updateNavLabel(defaultNavButton.querySelector("strong").textContent);
}
