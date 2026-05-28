(function () {
  window.M3Heroes = window.M3Heroes || {};

  const M3_ORANGE = "#e35526";
  const M3_ORANGE_VIBRANT = "#ff906b";
  const M3_ORANGE_GLOW = "rgba(227, 85, 38, 0.55)";
  const EDGE_COLOR = "rgba(255, 255, 255, 0.24)";
  const EDGE_COLOR_WARM = "rgba(255, 144, 107, 0.46)";

  // Slower, smoother cycle — continues looping while the card stays expanded.
  const GROW_MS = 4500;
  const HOLD_MS = 700;
  const RETRACT_MS = 2200;
  const CYCLE_MS = GROW_MS + HOLD_MS + RETRACT_MS;
  const NETWORK_SPREAD = 3.4;
  const START_ZOOM = 15;
  const FIT_PADDING = 1.08;
  const ZOOM_BOOST = 1.85;
  const ZOOM_LERP = 0.045;

  function createRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function buildNetwork(nodeCount, rng) {
    const nodes = [{ x: 0, y: 0, r: 5, order: 0, degree: 0 }];
    const edges = [];

    for (let i = 1; i < nodeCount; i += 1) {
      const weights = nodes.map((node) => node.degree + 1);
      const total = weights.reduce((sum, w) => sum + w, 0);
      let pick = rng() * total;
      let parentIdx = 0;
      for (let j = 0; j < nodes.length; j += 1) {
        pick -= weights[j];
        if (pick <= 0) {
          parentIdx = j;
          break;
        }
      }

      const parent = nodes[parentIdx];
      const angle = rng() * Math.PI * 2;
      const dist = 34 + rng() * 52 + Math.min(i * 0.38, 36);
      const x = parent.x + Math.cos(angle) * dist;
      const y = parent.y + Math.sin(angle) * dist;
      const r = 0.9 + rng() * 1.1;

      nodes.push({ x, y, r, order: i, degree: 0 });
      edges.push({ a: parentIdx, b: i, order: i, stretch: 0 });

      parent.degree += 1;
      nodes[i].degree += 1;

      if (i > 14 && rng() < 0.1) {
        let target = Math.floor(rng() * i);
        if (target === parentIdx) target = (target + 1) % i;
        if (target !== parentIdx) {
          const lo = Math.min(parentIdx, target);
          const hi = Math.max(parentIdx, target);
          const exists = edges.some((edge) => edge.a === lo && edge.b === hi);
          if (!exists) {
            edges.push({ a: lo, b: hi, order: i + 0.3, stretch: 0 });
            nodes[lo].degree += 1;
            nodes[hi].degree += 1;
          }
        }
      }
    }

    for (let k = 0; k < 6; k += 1) {
      const a = 1 + Math.floor(rng() * (nodes.length - 1));
      const b = 1 + Math.floor(rng() * (nodes.length - 1));
      if (a === b) continue;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const exists = edges.some((edge) => edge.a === lo && edge.b === hi);
      if (exists) continue;
      edges.push({ a: lo, b: hi, order: nodeCount + k * 0.1, stretch: 0 });
      nodes[lo].degree += 1;
      nodes[hi].degree += 1;
    }

    edges.sort((left, right) => left.order - right.order);

    nodes.forEach((node, index) => {
      node.x *= NETWORK_SPREAD;
      node.y *= NETWORK_SPREAD;
      node.r =
        index === 0
          ? 5
          : 1.35 + Math.min(node.degree * 0.34, 1.65) + (index % 5) * 0.06;
    });

    return { nodes, edges };
  }

  function getVisibleBounds(nodes, visibleCount) {
    if (visibleCount <= 1) {
      return { minX: -4, maxX: 4, minY: -4, maxY: 4, width: 8, height: 8 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < visibleCount; i += 1) {
      const node = nodes[i];
      minX = Math.min(minX, node.x - node.r - 6);
      maxX = Math.max(maxX, node.x + node.r + 6);
      minY = Math.min(minY, node.y - node.r - 6);
      maxY = Math.max(maxY, node.y + node.r + 6);
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function fitZoom(bounds, viewW, viewH, padding = FIT_PADDING) {
    if (bounds.width < 12 && bounds.height < 12) return START_ZOOM;
    const zx = viewW / (bounds.width * padding);
    const zy = viewH / (bounds.height * padding);
    return Math.min(zx, zy) * ZOOM_BOOST;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }

  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  }

  function easeInCubic(t) {
    return t ** 3;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  window.M3Heroes.mountM3MarketingNetwork = async function mountM3MarketingNetwork(container) {
    const canvas = document.createElement("canvas");
    canvas.className = "feature-hero__canvas m3-network-demo__canvas";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);
    container.classList.add("feature-hero__network-mount");

    const ctx = canvas.getContext("2d");
    const network = buildNetwork(58, createRng(90210));
    const { nodes, edges } = network;
    const fullBounds = getVisibleBounds(nodes, nodes.length);

    let viewW = 1;
    let viewH = 1;
    let dpr = 1;
    let rafId = null;
    let cancelled = false;
    let isPlaying = false;
    let cycleStart = 0;
    let zoom = START_ZOOM;
    let targetZoom = START_ZOOM;
    let maxZoom = START_ZOOM;

    function resizeCanvas() {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = Math.max(rect.width, 1);
      viewH = Math.max(rect.height, 1);
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
      canvas.style.width = `${viewW}px`;
      canvas.style.height = `${viewH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function syncMaxZoom() {
      maxZoom = fitZoom(fullBounds, viewW, viewH);
    }

    function computePhase(elapsed) {
      if (elapsed < GROW_MS) {
        return { name: "grow", t: elapsed / GROW_MS, elapsed };
      }
      if (elapsed < GROW_MS + HOLD_MS) {
        return { name: "hold", t: (elapsed - GROW_MS) / HOLD_MS, elapsed };
      }
      return {
        name: "retract",
        t: (elapsed - GROW_MS - HOLD_MS) / RETRACT_MS,
        elapsed,
      };
    }

    function computeTargetZoom(phase) {
      const t = Math.min(1, phase.t);
      if (phase.name === "grow") {
        return START_ZOOM + (maxZoom - START_ZOOM) * easeInOutCubic(t);
      }
      if (phase.name === "hold") {
        return maxZoom;
      }
      return maxZoom + (START_ZOOM - maxZoom) * easeInOutCubic(t);
    }

    function getVisibleCount(phase) {
      if (phase.name === "grow") {
        return 1 + Math.floor(easeOutCubic(Math.min(1, phase.t)) * (nodes.length - 1));
      }
      if (phase.name === "hold") {
        return nodes.length;
      }
      const t = Math.min(1, phase.t);
      const hidden = Math.floor(easeInCubic(t) * (nodes.length - 1));
      return Math.max(1, nodes.length - hidden);
    }

    function drawFrame(elapsed) {
      const phase = computePhase(elapsed);
      const visibleCount = getVisibleCount(phase);
      targetZoom = computeTargetZoom(phase);
      zoom += (targetZoom - zoom) * ZOOM_LERP;

      ctx.clearRect(0, 0, viewW, viewH);
      ctx.save();
      ctx.translate(viewW / 2, viewH / 2);
      ctx.scale(zoom, zoom);

      const now = elapsed;

      edges.forEach((edge) => {
        const nodeA = nodes[edge.a];
        const nodeB = nodes[edge.b];
        const revealAt = (edge.order / nodes.length) * GROW_MS * 0.92;
        let stretch = 1;
        let visible = edge.a < visibleCount && edge.b < visibleCount;

        if (phase.name === "grow") {
          if (!visible || now < revealAt) return;
          stretch = Math.min(1, (now - revealAt) / (GROW_MS * 0.09));
        } else if (phase.name === "retract") {
          const hideAt =
            GROW_MS +
            HOLD_MS +
            ((nodes.length - Math.max(edge.a, edge.b)) / nodes.length) * RETRACT_MS * 0.82;
          if (now > hideAt) return;
          stretch = Math.min(1, (hideAt - now) / (RETRACT_MS * 0.14));
        } else if (!visible) {
          return;
        }

        const x2 = nodeA.x + (nodeB.x - nodeA.x) * stretch;
        const y2 = nodeA.y + (nodeB.y - nodeA.y) * stretch;
        const warm = nodeA.degree > 3 || nodeB.degree > 3;

        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = warm ? EDGE_COLOR_WARM : EDGE_COLOR;
        ctx.lineWidth = warm ? 0.62 : 0.48;
        ctx.stroke();
      });

      for (let i = 0; i < visibleCount; i += 1) {
        const node = nodes[i];
        const revealAt = (node.order / (nodes.length - 1)) * GROW_MS * 0.9;
        let alpha = 1;
        let scale = 1;

        if (phase.name === "grow" && i > 0) {
          if (now < revealAt) continue;
          const growT = Math.min(1, (now - revealAt) / (GROW_MS * 0.08));
          alpha = easeOutCubic(growT);
          scale = 0.2 + easeOutCubic(growT) * 0.8;
        } else if (phase.name === "retract" && i > 0) {
          const hideAt =
            GROW_MS +
            HOLD_MS +
            ((nodes.length - i) / (nodes.length - 1)) * RETRACT_MS * 0.88;
          if (now > hideAt) continue;
          const hideT = Math.min(1, (hideAt - now) / (RETRACT_MS * 0.15));
          alpha = easeInOutQuad(hideT);
          scale = 0.15 + hideT * 0.85;
        }

        const radius = node.r * scale;
        const isHub = node.degree > 4;
        const isCore = i === 0;

        if (isCore || isHub) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius * 2.1, 0, Math.PI * 2);
          ctx.fillStyle = isCore ? M3_ORANGE_GLOW : "rgba(255, 144, 107, 0.28)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isCore || isHub ? M3_ORANGE_VIBRANT : M3_ORANGE;
        ctx.globalAlpha = alpha * (isCore ? 1 : 0.92 + Math.min(node.degree * 0.03, 0.08));
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function tick(now) {
      if (cancelled || !isPlaying) return;
      if (!cycleStart) cycleStart = now;

      const elapsed = (now - cycleStart) % CYCLE_MS;

      drawFrame(elapsed);
      rafId = requestAnimationFrame(tick);
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cycleStart = 0;
    }

    function resetFrame() {
      syncMaxZoom();
      zoom = START_ZOOM;
      targetZoom = START_ZOOM;
      drawFrame(0);
    }

    function startLoop() {
      if (cancelled || !isPlaying) return;
      stopLoop();
      resetFrame();
      rafId = requestAnimationFrame(tick);
    }

    resizeCanvas();
    syncMaxZoom();
    resetFrame();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      syncMaxZoom();
      if (!isPlaying) resetFrame();
    });
    resizeObserver.observe(container);

    return {
      destroy() {
        cancelled = true;
        isPlaying = false;
        stopLoop();
        resizeObserver.disconnect();
        container.innerHTML = "";
        container.classList.remove("feature-hero__network-mount");
      },
      pause() {
        isPlaying = false;
        stopLoop();
        resetFrame();
      },
      resume() {
        if (cancelled) return;
        isPlaying = true;
        startLoop();
      },
      setVisible() {},
      resize() {
        resizeCanvas();
        syncMaxZoom();
        if (!isPlaying) resetFrame();
      },
    };
  };
})();
