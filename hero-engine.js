(function () {
  const mounted = new Map();
  let activeApproachId = null;

  function isHeroCardActive(container) {
    const card = container.closest(".accordion-panel, .color-panel");
    return card?.classList.contains("is-active");
  }

  function isHeroApproachActive(container) {
    const owner = container.closest(".approach");
    return owner && owner.id === `approach-${activeApproachId}`;
  }

  function syncHeroState(container, engine) {
    const approachActive = isHeroApproachActive(container);
    const cardActive = isHeroCardActive(container);

    if (!approachActive) {
      engine.pause?.();
      engine.setVisible?.(false);
      return;
    }

    engine.setVisible?.(true);
    engine.resize?.();

    if (cardActive) {
      engine.resume?.();
      engine.resize?.();
      return;
    }

    engine.pause?.();
    engine.resize?.();
  }

  async function mountHero(container) {
    if (mounted.has(container) || container.dataset.mounted === "pending") return;

    const type = container.dataset.hero;
    if (!type || !window.M3Heroes) return;

    container.dataset.mounted = "pending";
    let engine;

    if (type === "m3pixel" && window.M3Heroes.mountM3PixelGlobe) {
      engine = await window.M3Heroes.mountM3PixelGlobe(container);
    } else if (type === "m3send" && window.M3Heroes.mountM3SendLamp) {
      engine = await window.M3Heroes.mountM3SendLamp(container);
    } else if (type === "m3llm" && window.M3Heroes.mountM3LlmChat) {
      engine = await window.M3Heroes.mountM3LlmChat(container);
    } else if (type === "m3ads" && window.M3Heroes.mountM3AdsGoogle) {
      engine = await window.M3Heroes.mountM3AdsGoogle(container);
    } else if (type === "m3marketing" && window.M3Heroes.mountM3MarketingNetwork) {
      engine = await window.M3Heroes.mountM3MarketingNetwork(container);
    }

    if (engine) {
      mounted.set(container, engine);
      container.dataset.mounted = "true";
      syncHeroState(container, engine);
    } else {
      delete container.dataset.mounted;
    }
  }

  function destroyHero(container) {
    const engine = mounted.get(container);
    if (!engine) return;
    engine.destroy();
    mounted.delete(container);
    delete container.dataset.mounted;
  }

  function syncApproach(approachId) {
    activeApproachId = approachId;

    mounted.forEach((engine, container) => {
      const owner = container.closest(".approach");
      const isActive = owner && owner.id === `approach-${approachId}`;

      if (!isActive) {
        engine.pause?.();
        engine.setVisible?.(false);
      }
    });

    document.querySelectorAll(".approach .accordion-panel__hero[data-hero], .approach .color-panel__hero[data-hero]").forEach((container) => {
      const owner = container.closest(".approach");
      const isActive = owner && owner.id === `approach-${approachId}`;

      if (!isActive) {
        destroyHero(container);
        return;
      }

      if (!mounted.has(container)) {
        mountHero(container);
        return;
      }

      syncHeroState(container, mounted.get(container));
    });
  }

  window.addEventListener("m3:cards-changed", () => {
    document.querySelectorAll(".approach .accordion-panel__hero[data-hero], .approach .color-panel__hero[data-hero]").forEach((container) => {
      if (!isHeroApproachActive(container)) return;
      if (!mounted.has(container) && container.dataset.mounted !== "pending") {
        mountHero(container);
      }
    });

    mounted.forEach((engine, container) => {
      if (!isHeroApproachActive(container)) return;
      syncHeroState(container, engine);
    });
  });

  window.M3HeroEngine = { syncApproach };
})();
