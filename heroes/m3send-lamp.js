(function () {
  window.M3Heroes = window.M3Heroes || {};

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function prefixSvgIds(svg, prefix) {
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    let next = svg;
    ids.forEach((id) => {
      const scoped = `${prefix}-${id}`;
      next = next.replaceAll(`id="${id}"`, `id="${scoped}"`);
      next = next.replaceAll(`url(#${id})`, `url(#${scoped})`);
      next = next.replaceAll(`xlink:href="#${id}"`, `xlink:href="#${scoped}"`);
      next = next.replaceAll(`href="#${id}"`, `href="#${scoped}"`);
    });
    return next;
  }

  let lampTemplatePromise = null;

  function loadLampTemplate() {
    if (!lampTemplatePromise) {
      lampTemplatePromise = fetch("assets/m3send-lamp.svg").then((response) => response.text());
    }
    return lampTemplatePromise;
  }

  window.M3Heroes.mountM3SendLamp = async function mountM3SendLamp(container) {
    if (!window.gsap) return { destroy() {}, pause() {}, resume() {}, setVisible() {} };

    const prefix = `lamp-${Math.random().toString(36).slice(2, 9)}`;
    const template = await loadLampTemplate();
    container.innerHTML = prefixSvgIds(template, prefix);

    const svg = container.querySelector("svg");
    if (svg) {
      svg.setAttribute("class", "feature-hero__lamp");
      svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
    }

    const bg = container.querySelector(`#${prefix}-bg`);
    if (bg) bg.setAttribute("fill", "transparent");

    const blobs = [0, 1, 2, 3, 4]
      .map((index) => container.querySelector(`#${prefix}-blob${index}`))
      .filter(Boolean);

    const timeline = gsap.timeline();
    blobs.forEach((blob, index) => {
      timeline.add(
        gsap.to(blob, {
          duration: randomBetween(14, 50),
          y: 260,
          repeat: -1,
          repeatDelay: randomBetween(1, 3),
          yoyo: true,
          ease: "none",
        }),
        (index + 1) / 0.6
      );
    });
    timeline.seek(120);
    timeline.timeScale(2);

    return {
      destroy() {
        timeline.kill();
        container.innerHTML = "";
      },
      pause() {
        timeline.pause();
      },
      resume() {
        timeline.play();
      },
      setVisible() {},
    };
  };
})();
