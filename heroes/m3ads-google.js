(function () {
  window.M3Heroes = window.M3Heroes || {};

  // Matches data-interval="4500" — finish one full pass before the next card.
  const LOOP_DELAY = 0.65;
  const FINAL_HOLD = 2.4;

  function skeletonAdMarkup(variant) {
    return `
      <div class="m3-ads-demo__ad m3-ads-demo__ad--${variant}">
        <div class="m3-ads-demo__sk m3-ads-demo__sk--title"></div>
        <div class="m3-ads-demo__sk m3-ads-demo__sk--body"></div>
        <div class="m3-ads-demo__sk m3-ads-demo__sk--body m3-ads-demo__sk--short"></div>
        <div class="m3-ads-demo__sk m3-ads-demo__sk--cta"></div>
      </div>
    `;
  }

  function buildMarkup() {
    return `
      <div class="m3-ads-demo" aria-hidden="true">
        <div class="m3-ads-demo__stage">
          <div class="m3-ads-demo__browser">
            <div class="m3-ads-demo__browser-chrome">
              <span></span><span></span><span></span>
            </div>
            <div class="m3-ads-demo__browser-body">
              <div class="m3-ads-demo__search-row">
                <div class="m3-ads-demo__google-logo" aria-hidden="true">
                  <span class="m3-ads-demo__g m3-ads-demo__g--b">G</span><span
                  class="m3-ads-demo__g m3-ads-demo__g--r">o</span><span
                  class="m3-ads-demo__g m3-ads-demo__g--y">o</span><span
                  class="m3-ads-demo__g m3-ads-demo__g--b">g</span><span
                  class="m3-ads-demo__g m3-ads-demo__g--g">l</span><span
                  class="m3-ads-demo__g m3-ads-demo__g--r">e</span>
                </div>
                <div class="m3-ads-demo__search-bar"></div>
                <div class="m3-ads-demo__search-btn"></div>
              </div>
              <div class="m3-ads-demo__serp">
                <div class="m3-ads-demo__serp-main">
                  <div class="m3-ads-demo__result-hero"></div>
                  <div class="m3-ads-demo__result">
                    <div class="m3-ads-demo__result-title"></div>
                    <div class="m3-ads-demo__result-line"></div>
                    <div class="m3-ads-demo__result-line m3-ads-demo__result-line--short"></div>
                  </div>
                  <div class="m3-ads-demo__result">
                    <div class="m3-ads-demo__result-title"></div>
                    <div class="m3-ads-demo__result-line"></div>
                    <div class="m3-ads-demo__result-line m3-ads-demo__result-line--short"></div>
                  </div>
                </div>
                <div class="m3-ads-demo__serp-sidebar">
                  <div class="m3-ads-demo__ad-slot">
                    <div class="m3-ads-demo__slot-placeholder"></div>
                    <div class="m3-ads-demo__slot-glow-clip">
                      <div class="m3-ads-demo__slot-glow-blob"></div>
                    </div>
                    <div class="m3-ads-demo__slot-ad">${skeletonAdMarkup("vibrant")}</div>
                  </div>
                  <div class="m3-ads-demo__sidebar-block"></div>
                  <div class="m3-ads-demo__sidebar-block"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="m3-ads-demo__float-wrap">
            <div class="m3-ads-demo__float-glow-clip">
              <div class="m3-ads-demo__float-glow-blob"></div>
            </div>
            ${skeletonAdMarkup("boring")}
            ${skeletonAdMarkup("vibrant")}
          </div>
        </div>
      </div>
    `;
  }

  const GLOW = {
    fadeIn: 0.28,
    sweep: 1.05,
    fadeOut: 0.38,
    fadeOutAt: 0.62,
    revealStart: 0.34,
  };

  function makeLiquidGlowTL(blobEl, options = {}) {
    const { onReveal } = options;
    blobEl._revealed = 0;

    const sub = gsap.timeline();

    sub.fromTo(
      blobEl,
      { xPercent: 0, yPercent: -50, opacity: 0 },
      { opacity: 1, duration: GLOW.fadeIn, ease: "power2.out" }
    );

    sub.to(
      blobEl,
      {
        xPercent: -50,
        yPercent: 0,
        duration: GLOW.sweep,
        ease: "sine.inOut",
        onUpdate() {
          if (!onReveal) return;
          const progress = this.progress();
          if (progress < GLOW.revealStart) return;
          const revealT = (progress - GLOW.revealStart) / (1 - GLOW.revealStart);
          const next = Math.min(1, revealT);
          if (next <= blobEl._revealed) return;
          blobEl._revealed = next;
          onReveal(next);
        },
      },
      0
    );

    sub.to(blobEl, { opacity: 0, duration: GLOW.fadeOut, ease: "power2.in" }, GLOW.fadeOutAt);

    return sub;
  }

  function syncFloatSize(floatWrap, slot) {
    const rect = slot.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w > 4 && h > 4) {
      floatWrap.style.width = `${w}px`;
      floatWrap.style.height = `${h}px`;
      floatWrap.style.boxSizing = "border-box";
      return true;
    }
    return false;
  }

  function measureDockOffset(floatWrap, slot) {
    const fr = floatWrap.getBoundingClientRect();
    const sl = slot.getBoundingClientRect();
    if (!fr.width || !sl.width) return { x: 0, y: 0 };

    return {
      x: sl.left + sl.width / 2 - (fr.left + fr.width / 2),
      y: sl.top + sl.height / 2 - (fr.top + fr.height / 2),
    };
  }

  function isHorizontalCard(container) {
    return Boolean(container.closest(".accordion-showcase--horizontal"));
  }

  function isCarouselCard(container) {
    return Boolean(container.closest(".carousel-showcase"));
  }

  function getIntroAnchor(container) {
    if (isCarouselCard(container)) {
      return { left: "50%", top: "46%" };
    }
    return isHorizontalCard(container)
      ? { left: "83.333%", top: "44%" }
      : { left: "50%", top: "44%" };
  }

  function getBrowserOffscreen(container) {
    if (isCarouselCard(container)) {
      return { xPercent: -118, opacity: 0.96 };
    }
    return isHorizontalCard(container)
      ? { xPercent: 118, opacity: 0.96 }
      : { xPercent: -118, opacity: 0.96 };
  }

  window.M3Heroes.mountM3AdsGoogle = async function mountM3AdsGoogle(container) {
    if (!window.gsap) {
      return { destroy() {}, pause() {}, resume() {}, setVisible() {}, resize() {} };
    }

    container.innerHTML = buildMarkup();
    container.classList.add("feature-hero__ads-mount");

    const stage = container.querySelector(".m3-ads-demo__stage");
    const browser = container.querySelector(".m3-ads-demo__browser");
    const floatWrap = container.querySelector(".m3-ads-demo__float-wrap");
    const boringAd = floatWrap.querySelector(".m3-ads-demo__ad--boring");
    const vibrantAd = floatWrap.querySelector(".m3-ads-demo__ad--vibrant");
    const floatBlob = floatWrap.querySelector(".m3-ads-demo__float-glow-blob");
    const slot = container.querySelector(".m3-ads-demo__ad-slot");
    const slotAd = container.querySelector(".m3-ads-demo__slot-ad");
    const slotPlaceholder = container.querySelector(".m3-ads-demo__slot-placeholder");
    const slotGlowBlob = container.querySelector(".m3-ads-demo__slot-glow-blob");

    const INTRO_SCALE = 2.55;

    function getIntroScale() {
      return isCarouselCard(container) ? 1.35 : INTRO_SCALE;
    }
    let dockOffset = { x: 0, y: 0 };
    let master = null;
    let cancelled = false;
    let isPlaying = false;
    let rafId = null;
    let stableW = 0;
    let stableH = 0;
    let stableCount = 0;

    function resetScene() {
      const anchor = getIntroAnchor(container);
      const horizontal = isHorizontalCard(container);
      syncFloatSizeFromSlot();
      floatBlob._revealed = 0;
      slotGlowBlob._revealed = 0;
      gsap.set(browser, getBrowserOffscreen(container));
      gsap.set(floatWrap, {
        xPercent: -50,
        yPercent: -50,
        left: anchor.left,
        top: anchor.top,
        x: 0,
        y: 0,
        scale: getIntroScale(),
        opacity: 1,
      });
      gsap.set(boringAd, { opacity: 1 });
      gsap.set(vibrantAd, { opacity: 0 });
      gsap.set(floatBlob, { xPercent: 0, yPercent: -50, opacity: 0 });
      gsap.set(slotGlowBlob, { xPercent: 0, yPercent: -50, opacity: 0 });
      gsap.set(slotAd, { opacity: 0, scale: 1 });
      gsap.set(slotPlaceholder, { opacity: horizontal ? 0 : 1 });
    }

    function crossfadeIntroAds(amount) {
      gsap.set(boringAd, { opacity: 1 - amount });
      gsap.set(vibrantAd, { opacity: amount });
    }

    function syncFloatSizeFromSlot() {
      return syncFloatSize(floatWrap, slot);
    }

    function prepareDock() {
      syncFloatSizeFromSlot();
      gsap.set(floatWrap, { scale: 1 });
      dockOffset = measureDockOffset(floatWrap, slot);
    }

    function buildTimeline() {
      const horizontal = isHorizontalCard(container);
      const browserExit = horizontal ? 118 : -118;

      const tl = gsap.timeline({
        paused: true,
        repeat: -1,
        repeatDelay: LOOP_DELAY,
        defaults: { ease: "power2.inOut" },
        onRepeat: resetScene,
      });

      tl.addLabel("intro", 0.2);
      tl.add(
        makeLiquidGlowTL(floatBlob, {
          onReveal: crossfadeIntroAds,
        }),
        "intro"
      );
      tl.to({}, { duration: 0.35 }, "intro+=1.05");

      if (horizontal) {
        tl.addLabel("browser", "intro+=1.4");
        tl.to(browser, { xPercent: 0, opacity: 1, duration: 0.82, ease: "power3.out" }, "browser");

        tl.addLabel("scale", "browser+=0.82");
        tl.to(floatWrap, { scale: 1, duration: 0.68, ease: "power2.out" }, "scale");

        tl.addLabel("dock", "scale+=0.55");
        tl.call(prepareDock, null, "dock");
        tl.to(
          floatWrap,
          {
            x: () => dockOffset.x,
            y: () => dockOffset.y,
            scale: 1,
            duration: 0.88,
            ease: "power3.inOut",
          },
          "dock"
        );

        tl.addLabel("complete", "dock+=0.88");
        tl.to({}, { duration: FINAL_HOLD }, "complete");
        tl.addLabel("outro", `complete+=${FINAL_HOLD}`);
        tl.to(floatWrap, { opacity: 0, duration: 0.38, ease: "power2.in" }, "outro");
        tl.to(browser, { xPercent: browserExit, duration: 0.72, ease: "power2.inOut" }, "outro+=0.12");
        tl.to(
          floatWrap,
          {
            x: 0,
            y: 0,
            scale: getIntroScale(),
            opacity: 1,
            duration: 0.72,
            ease: "power2.inOut",
          },
          "outro+=0.18"
        );
        tl.call(crossfadeIntroAds.bind(null, 0), null, "outro+=0.18");

        return tl;
      }

      tl.addLabel("browser", "intro+=1.5");
      tl.to(browser, { xPercent: 0, duration: 0.82, ease: "power3.out" }, "browser");
      tl.to(floatWrap, { scale: 1, duration: 0.68, ease: "power2.out" }, "browser+=0.12");

      tl.addLabel("dock", "browser+=0.82");
      tl.call(prepareDock, null, "dock");
      tl.to(
        floatWrap,
        {
          x: () => dockOffset.x,
          y: () => dockOffset.y,
          scale: 1,
          duration: 0.88,
          ease: "power3.inOut",
        },
        "dock"
      );

      tl.add(
        makeLiquidGlowTL(slotGlowBlob, {
          onReveal: (amount) => {
            gsap.set(slotPlaceholder, { opacity: 1 - amount });
            gsap.set(slotAd, { opacity: amount, scale: 1 });
          },
        }),
        "dock+=0.58"
      );
      tl.to(floatWrap, { opacity: 0, duration: 0.22, ease: "power2.in" }, "dock+=0.72");

      tl.addLabel("complete", "dock+=1.65");
      tl.to({}, { duration: FINAL_HOLD }, "complete");
      tl.addLabel("outro", `complete+=${FINAL_HOLD}`);
      tl.to(slotAd, { opacity: 0, scale: 1, duration: 0.38, ease: "power2.in" }, "outro");
      tl.to(slotPlaceholder, { opacity: 1, duration: 0.32 }, "outro+=0.06");
      tl.to(browser, { xPercent: browserExit, duration: 0.72, ease: "power2.inOut" }, "outro+=0.12");
      tl.to(
        floatWrap,
        {
          x: 0,
          y: 0,
          scale: getIntroScale(),
          opacity: 1,
          duration: 0.72,
          ease: "power2.inOut",
        },
        "outro+=0.18"
      );
      tl.call(crossfadeIntroAds.bind(null, 0), null, "outro+=0.18");

      return tl;
    }

    function cancelLayoutWait() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      stableW = 0;
      stableH = 0;
      stableCount = 0;
    }

    function startFromBeginning() {
      if (cancelled || !isPlaying) return;

      if (!syncFloatSizeFromSlot()) {
        waitForLayoutThenStart();
        return;
      }

      resetScene();

      if (!master) {
        master = buildTimeline();
      } else {
        master.pause(0);
        master.invalidate();
      }

      master.restart(true);
      master.play();
    }

    function waitForLayoutThenStart() {
      if (cancelled || !isPlaying) return;

      const rect = slot.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w > 4 && h > 4 && w === stableW && h === stableH) {
        stableCount += 1;
      } else {
        stableW = w;
        stableH = h;
        stableCount = 0;
      }

      if (stableCount >= 4) {
        startFromBeginning();
        return;
      }

      rafId = requestAnimationFrame(waitForLayoutThenStart);
    }

    resetScene();

    return {
      destroy() {
        cancelled = true;
        isPlaying = false;
        cancelLayoutWait();
        master?.kill();
        master = null;
        container.innerHTML = "";
        container.classList.remove("feature-hero__ads-mount");
      },
      pause() {
        isPlaying = false;
        cancelLayoutWait();
        master?.pause(0);
        resetScene();
      },
      resume() {
        if (cancelled) return;
        isPlaying = true;
        cancelLayoutWait();
        waitForLayoutThenStart();
      },
      setVisible() {},
      resize() {
        if (cancelled) return;
        syncFloatSizeFromSlot();
        if (!isPlaying) {
          master?.pause(0);
          resetScene();
          return;
        }
        startFromBeginning();
      },
    };
  };
})();
