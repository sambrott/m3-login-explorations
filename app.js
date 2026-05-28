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

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (!document.body.classList.contains("is-auto-cycling")) return;
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

  return { setActive, start, stop, pause, resume: scheduleResume };
}

document.querySelectorAll("[data-cycling]").forEach((root) => {
  const approach = root.closest(".approach");
  if (!approach) return;

  const cycler = setupCyclingCards(root, root.dataset.cycling, Number(root.dataset.interval) || 4500);
  if (cycler) cyclers.set(approach.id, cycler);
});

const frameToggle = document.querySelector(".frame-mode-toggle-switch");
const lightCardsToggle = document.querySelector(".light-cards-toggle-switch");
const activePanelDarkToggle = document.querySelector(".active-panel-dark-toggle-switch");
const activePanelDarkRow = document.querySelector(".active-panel-dark-toggle-row");
const autoCycleToggle = document.querySelector(".auto-cycle-toggle-switch");
const frameSizeSlider = document.getElementById("frame-size-slider");
const frameSizeValue = document.querySelector(".frame-size-value");
const frameInsetSlider = document.getElementById("frame-inset-slider");
const frameInsetValue = document.querySelector(".frame-inset-value");
const copyConfigButton = document.querySelector(".approach-nav-panel__copy");

const FRAME_OUTER_MAX_PX = 160;
const FRAME_INSET_MAX_PX = 56;
const CHAT_OFFSET_CENTER_LEVEL = 5;
const CHAT_OFFSET_BASE_PERCENT = -8;
const CHAT_OFFSET_STEP_PERCENT = 8;
const DEFAULT_FRAMED = true;
const DEFAULT_LIGHT_CARDS = true;
const DEFAULT_ACTIVE_PANEL_DARK = true;
const DEFAULT_AUTO_CYCLE = false;
const DEFAULT_APPROACH = "accordion-h-left";
const DEFAULT_FRAME_SIZE_LEVEL = 4;
const DEFAULT_FRAME_INSET_LEVEL = 4;
const DEFAULT_CHAT_OFFSET_LEVEL = 4;

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

function getChatOffsetLevel() {
  return DEFAULT_CHAT_OFFSET_LEVEL;
}

function getChatOffsetPercent(level = getChatOffsetLevel()) {
  const resolved = Math.max(0, Math.min(10, Number(level) || 0));
  const percent =
    CHAT_OFFSET_BASE_PERCENT + (CHAT_OFFSET_CENTER_LEVEL - resolved) * CHAT_OFFSET_STEP_PERCENT;
  return Math.round(percent * 10) / 10;
}

function applyChatOffset(level = DEFAULT_CHAT_OFFSET_LEVEL) {
  const resolved = Math.max(0, Math.min(10, Number(level) || 0));
  const percent = getChatOffsetPercent(resolved);
  document.documentElement.style.setProperty("--llm-chat-offset-y", `${percent}%`);
  scheduleHeroResize();
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
  const chatOffsetLevel = getChatOffsetLevel();
  const chatOffsetPercent = getChatOffsetPercent(chatOffsetLevel);
  const isFramed = document.body.classList.contains("is-framed");
  const lightCards = document.body.classList.contains("is-light-cards");
  const activePanelDark = document.body.classList.contains("is-active-panel-dark");
  const autoCycle = document.body.classList.contains("is-auto-cycling");
  const activeButton = document.querySelector(".approach-nav-panel__btn.is-active");
  const approachLabel = activeButton?.querySelector("strong")?.textContent?.trim() ?? activeApproach;

  return {
    approach: activeApproach,
    approachLabel,
    framed: isFramed,
    lightCards,
    activePanelDark,
    autoCycle,
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
    chatOffset: {
      level: chatOffsetLevel,
      translateY: `${chatOffsetPercent}%`,
      centerLevel: CHAT_OFFSET_CENTER_LEVEL,
      stepPercent: CHAT_OFFSET_STEP_PERCENT,
      basePercent: CHAT_OFFSET_BASE_PERCENT,
    },
    cssVariables: {
      "--frame-outer-user": `${sizePx}px`,
      "--frame-inner-user": `${insetPx}px`,
      "--llm-chat-offset-y": `${chatOffsetPercent}%`,
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
      ],
    },
  };
}

function formatExplorationConfig(config) {
  const cssBlock = `:root {
  --frame-outer-user: ${config.cssVariables["--frame-outer-user"]};
  --frame-inner-user: ${config.cssVariables["--frame-inner-user"]};
  --llm-chat-offset-y: ${config.cssVariables["--llm-chat-offset-y"]};
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
applyFrameSize(${config.frameSize.level});
applyFrameInset(${config.cardInset.level});
applyChatOffset(${config.chatOffset.level});

// Or set directly:
document.documentElement.style.setProperty("--frame-outer-user", "${config.cssVariables["--frame-outer-user"]}");
document.documentElement.style.setProperty("--frame-inner-user", "${config.cssVariables["--frame-inner-user"]}");
document.documentElement.style.setProperty("--llm-chat-offset-y", "${config.cssVariables["--llm-chat-offset-y"]}");`;

  return `# M3 Login Explorations — copied settings

approach: ${config.approach}
approachLabel: ${config.approachLabel}
framed: ${config.framed}
lightCards: ${config.lightCards}
activePanelDark: ${config.activePanelDark}
autoCycle: ${config.autoCycle}
frameSize.level: ${config.frameSize.level}
frameSize.px: ${config.frameSize.px}
cardInset.level: ${config.cardInset.level}
cardInset.px: ${config.cardInset.px}
chatOffset.level: ${config.chatOffset.level}
chatOffset.translateY: ${config.chatOffset.translateY}

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
    if (isOn) cycler.start();
    else cycler.stop();
  });
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

frameSizeSlider?.addEventListener("input", (event) => {
  applyFrameSize(event.target.value);
});

frameInsetSlider?.addEventListener("input", (event) => {
  applyFrameInset(event.target.value);
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

syncFrameControls(DEFAULT_FRAMED);
syncLightCards(DEFAULT_LIGHT_CARDS);
syncActivePanelDark(DEFAULT_ACTIVE_PANEL_DARK);
syncAutoCycle(DEFAULT_AUTO_CYCLE);

applyFrameSize(frameSizeSlider?.value ?? DEFAULT_FRAME_SIZE_LEVEL);
applyFrameInset(frameInsetSlider?.value ?? DEFAULT_FRAME_INSET_LEVEL);
applyChatOffset(DEFAULT_CHAT_OFFSET_LEVEL);

activateApproach(DEFAULT_APPROACH);
