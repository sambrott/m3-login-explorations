(function () {
  window.M3Heroes = window.M3Heroes || {};

  const GLOBE_OPTIONS = {
    autoRotate: false,
    draggable: true,
    grabCursor: true,
    mapLandColor: "#121212",
    mapSeaColor: "#1a1a1a",
    mapBorderColor: "#242424",
    mapBorderWidth: 0.1,
    light: "simple",
    lightIntensity: 1,
    location: { lat: 42, lng: -125 },
    quality: window.innerWidth < 780 ? 4 : 6,
    shininess: 100,
    transparent: true,
    zoom: 1.25,
  };

  const VISIT_LOCATIONS = [
    { lat: 40.7128, lng: -74.006 },
    { lat: 34.0522, lng: -118.2437 },
    { lat: 41.8781, lng: -87.6298 },
    { lat: 29.7604, lng: -95.3698 },
    { lat: 33.749, lng: -84.388 },
    { lat: 25.7617, lng: -80.1918 },
    { lat: 37.7749, lng: -122.4194 },
    { lat: 47.6062, lng: -122.3321 },
    { lat: 39.7392, lng: -104.9903 },
    { lat: 42.3601, lng: -71.0589 },
    { lat: 32.7767, lng: -96.797 },
    { lat: 45.5152, lng: -122.6784 },
    { lat: 38.9072, lng: -77.0369 },
    { lat: 36.1699, lng: -115.1398 },
    { lat: 51.5074, lng: -0.1278 },
    { lat: 48.8566, lng: 2.3522 },
    { lat: 52.52, lng: 13.405 },
    { lat: 55.7558, lng: 37.6173 },
    { lat: 35.6762, lng: 139.6503 },
    { lat: 31.2304, lng: 121.4737 },
    { lat: 1.3521, lng: 103.8198 },
    { lat: 19.4326, lng: -99.1332 },
    { lat: -23.5505, lng: -46.6333 },
    { lat: -33.8688, lng: 151.2093 },
    { lat: 28.6139, lng: 77.209 },
    { lat: 25.2048, lng: 55.2708 },
    { lat: 43.6532, lng: -79.3832 },
    { lat: 49.2827, lng: -123.1207 },
  ];

  const ANIMATION_DURATION = 750;
  const VISIT_INTERVAL_MS = 2200;
  const RING_PULSE_SCALE_START = 0.42;
  const RING_PULSE_SCALE_END = 2.65;
  const CORE_VISIBLE_SCALE = 0.11;
  const M3_ORANGE = "#e35526";
  const M3_ORANGE_VIBRANT = "#ff906b";

  let mapSvgPromise = null;
  let dotImagesPromise = null;

  function svgToDataUrl(svg) {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function loadMapSvg() {
    if (!mapSvgPromise) {
      mapSvgPromise = fetch("assets/earth-map.svg").then((response) => {
        if (!response.ok) throw new Error("Failed to load earth map");
        return response.text();
      });
    }
    return mapSvgPromise;
  }

  function loadDotImages() {
    if (!dotImagesPromise) {
      dotImagesPromise = (async () => {
        async function loadSvgAsset(path) {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`Failed to load ${path}`);
          return svgToDataUrl(await response.text());
        }

        async function loadOptionalPng(path) {
          const response = await fetch(path);
          if (!response.ok) return null;
          const blob = await response.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const [pngCore, ring] = await Promise.all([
          loadOptionalPng("assets/globe-point.png"),
          loadSvgAsset("assets/globe-point-ring.svg"),
        ]);

        const core = pngCore || (await loadSvgAsset("assets/globe-point.svg"));

        return { core, ring };
      })();
    }
    return dotImagesPromise;
  }

  function emptyEngine() {
    return { destroy() {}, pause() {}, resume() {}, resize() {}, setVisible() {} };
  }

  function renderFrame(earth) {
    if (!earth.ready) return;
    earth.updateBounds();
    earth.renderer.render(earth.scene, earth.camera);
  }

  function scheduleBoundsUpdate(earth) {
    window.requestAnimationFrame(() => {
      if (!earth.ready) return;
      earth.updateBounds();
      if (earth.paused) earth.renderer.render(earth.scene, earth.camera);
    });
    window.setTimeout(() => {
      if (!earth.ready) return;
      earth.updateBounds();
      if (earth.paused) earth.renderer.render(earth.scene, earth.camera);
    }, 650);
  }

  function visitKey(location) {
    return `${location.lat},${location.lng}`;
  }

  function randomVisitDelay() {
    return Math.random() * 9000 + 1000;
  }

  function createVisitMarker(earth, images, location) {
    const spriteOptions = {
      location,
      occlude: true,
      imageAlphaOnly: true,
      color: M3_ORANGE,
      imageResolution: 128,
      offset: 0,
    };

    const core = earth.addSprite({
      ...spriteOptions,
      color: M3_ORANGE_VIBRANT,
      image: images.core,
      scale: 0,
    });

    const ring = earth.addSprite({
      ...spriteOptions,
      image: images.ring,
      scale: RING_PULSE_SCALE_START,
      opacity: 0,
    });

    if (!core || !ring) {
      core?.remove?.();
      ring?.remove?.();
      return null;
    }

    return {
      core,
      ring,
      removed: false,
      remove() {
        if (this.removed) return;
        this.removed = true;
        this.core.remove?.();
        this.ring.remove?.();
      },
    };
  }

  function pulseOuterRing(marker, onComplete) {
    if (marker.removed) {
      onComplete?.();
      return;
    }

    const { ring } = marker;
    ring.scale = RING_PULSE_SCALE_START;
    ring.opacity = 0;

    ring.animate("opacity", 0.62, {
      duration: 120,
      easing: "out-quad",
      complete: () => {
        if (marker.removed) {
          onComplete?.();
          return;
        }

        ring.animate("scale", RING_PULSE_SCALE_END, {
          duration: ANIMATION_DURATION,
          easing: "out-quad",
        });

        ring.animate("opacity", 0, {
          duration: ANIMATION_DURATION,
          easing: "in-quad",
          complete: () => {
            if (marker.removed) {
              onComplete?.();
              return;
            }

            ring.scale = RING_PULSE_SCALE_START;
            onComplete?.();
          },
        });
      },
    });
  }

  function animateVisitDot(marker, activeMarkers, key) {
    const startDelay = randomVisitDelay();
    let pulseTimer = null;
    let fadeTimer = null;

    function clearPulseLoop() {
      if (pulseTimer) window.clearTimeout(pulseTimer);
      pulseTimer = null;
    }

    function schedulePulseLoop() {
      if (marker.removed) return;

      pulseOuterRing(marker, () => {
        pulseTimer = window.setTimeout(schedulePulseLoop, 110);
      });
    }

    function fadeOutVisit() {
      if (marker.removed) return;
      clearPulseLoop();

      marker.core.animate("scale", CORE_VISIBLE_SCALE * 0.45, {
        duration: ANIMATION_DURATION,
        easing: "in-out-quad",
        complete: () => {
          if (marker.removed) return;

          marker.core.animate("scale", CORE_VISIBLE_SCALE * 0.08, {
            duration: ANIMATION_DURATION,
            easing: "in-out-quad",
            complete: () => {
              window.setTimeout(() => {
                if (marker.removed) return;

                marker.core.animate("scale", 0, {
                  duration: ANIMATION_DURATION,
                  easing: "in-quad",
                  complete: () => {
                    delete activeMarkers[key];
                    marker.remove();
                  },
                });

                marker.ring.animate("opacity", 0, {
                  duration: ANIMATION_DURATION,
                  easing: "in-quad",
                });
              }, randomVisitDelay());
            },
          });
        },
      });
    }

    window.setTimeout(() => {
      if (marker.removed) return;

      marker.core.animate("scale", CORE_VISIBLE_SCALE, {
        duration: ANIMATION_DURATION,
        easing: "out-quad",
        complete: () => {
          if (marker.removed) return;

          schedulePulseLoop();
          fadeTimer = window.setTimeout(fadeOutVisit, ANIMATION_DURATION * 4.5);
        },
      });
    }, startDelay);
  }

  function addVisitDot(earth, images, activeMarkers, location) {
    const key = visitKey(location);
    if (activeMarkers[key]) return null;

    const marker = createVisitMarker(earth, images, location);
    if (!marker) return null;

    activeMarkers[key] = marker;
    animateVisitDot(marker, activeMarkers, key);
    return marker;
  }

  function pickVisitLocation() {
    const location = VISIT_LOCATIONS[Math.floor(Math.random() * VISIT_LOCATIONS.length)];
    return {
      lat: location.lat + (Math.random() - 0.5) * 0.35,
      lng: location.lng + (Math.random() - 0.5) * 0.35,
    };
  }

  function createVisitSimulation(earth, images, activeMarkers) {
    const timeouts = new Set();
    let intervalId = null;
    let paused = false;

    function scheduleVisit(delayMs) {
      const timeoutId = window.setTimeout(() => {
        timeouts.delete(timeoutId);
        if (!paused) addVisitDot(earth, images, activeMarkers, pickVisitLocation());
      }, delayMs);
      timeouts.add(timeoutId);
    }

    function startInterval() {
      intervalId = window.setInterval(() => {
        addVisitDot(earth, images, activeMarkers, pickVisitLocation());
      }, VISIT_INTERVAL_MS);
    }

    for (let i = 0; i < 4; i += 1) {
      scheduleVisit(i * 450);
    }
    startInterval();

    return {
      pause() {
        paused = true;
        if (intervalId) window.clearInterval(intervalId);
        intervalId = null;
        timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        timeouts.clear();
      },
      resume() {
        if (!paused) return;
        paused = false;
        for (let i = 0; i < 2; i += 1) {
          scheduleVisit(i * 450);
        }
        startInterval();
      },
      destroy() {
        this.pause();
      },
    };
  }

  window.M3Heroes.mountM3PixelGlobe = async function mountM3PixelGlobe(container) {
    if (!window.Earth) return emptyEngine();

    const mount = document.createElement("div");
    mount.className = "feature-hero__earth";
    container.appendChild(mount);

    let dotImages;

    try {
      const [mapSvg, images] = await Promise.all([loadMapSvg(), loadDotImages()]);
      Earth.mapSvg = mapSvg;
      dotImages = images;
    } catch (error) {
      console.error("m3Pixel globe assets failed to load", error);
      container.innerHTML = "";
      return emptyEngine();
    }

    const earth = new Earth(mount, GLOBE_OPTIONS);
    const activeMarkers = {};
    let visitSimulation = null;

    const onReady = () => {
      visitSimulation = createVisitSimulation(earth, dotImages, activeMarkers);
      scheduleBoundsUpdate(earth);
    };

    if (earth.ready) {
      onReady();
    } else {
      earth.addEventListener("ready", onReady, { once: true });
    }

    const resizeObserver = new ResizeObserver(() => scheduleBoundsUpdate(earth));
    resizeObserver.observe(container);

    return {
      destroy() {
        resizeObserver.disconnect();
        visitSimulation?.destroy();
        Object.values(activeMarkers).forEach((marker) => marker.remove?.());
        earth.destroy();
        container.innerHTML = "";
      },
      pause() {
        earth.paused = true;
        visitSimulation?.pause();
        renderFrame(earth);
      },
      resume() {
        earth.paused = false;
        visitSimulation?.resume();
        scheduleBoundsUpdate(earth);
      },
      resize() {
        scheduleBoundsUpdate(earth);
      },
      setVisible(isVisible) {
        if (!isVisible) {
          earth.paused = true;
        } else {
          earth.paused = false;
        }
        scheduleBoundsUpdate(earth);
      },
    };
  };
})();
