(function () {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const title = hero.querySelector(".display-xl");
  if (!title) return;


  const canvas = document.createElement("canvas");
  canvas.className = "hero-particles";
  canvas.setAttribute("aria-hidden", "true");
  title.insertAdjacentElement("afterend", canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  const config = {
    step: 4,
    stepMobile: 4,
    dotSize: 1.6,
    dotSizeMobile: 1.8,
    repelRadius: 90,
    repelStrength: 28,
    spring: 0.18,
    damping: 0.72,
  };

  let particles = [];
  let w = 0,
    h = 0,
    dpr = 1;
  let mouseX = -9999,
    mouseY = -9999;
  let rafId = null;
  let isVisible = true;
  let cachedColor = readColor();
  let isMobile = window.innerWidth < 768;
  let dotSize = isMobile ? config.dotSizeMobile : config.dotSize;

  function readColor() {
    return (
      getComputedStyle(document.body).getPropertyValue("--on-dark").trim() ||
      "#fff"
    );
  }

  function sampleStep() {
    return isMobile ? config.stepMobile : config.step;
  }

  async function build() {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {}
    }

    const style = getComputedStyle(title);
    const fontSize = parseFloat(style.fontSize);
    const letterSpacing = parseFloat(style.letterSpacing) || 0;
    const text = title.textContent.trim();

    const measure = document.createElement("canvas").getContext("2d");
    measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const baseMetrics = measure.measureText(text);

    const spacingTotal = letterSpacing * (text.length - 1);
    const textWidth = Math.ceil(baseMetrics.width + spacingTotal);
    const ascent = baseMetrics.actualBoundingBoxAscent || fontSize * 0.8;
    const descent = baseMetrics.actualBoundingBoxDescent || fontSize * 0.2;
    const textHeight = Math.ceil(ascent + descent);

    w = textWidth;
    h = textHeight;
    dpr = window.devicePixelRatio || 1;

    const maxDisplay = Math.max(
      0,
      (hero.clientWidth || window.innerWidth) - 32,
    );
    const displayW = maxDisplay && w > maxDisplay ? maxDisplay : w;
    const displayH = Math.round(h * (displayW / w));

    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ofc = document.createElement("canvas");
    ofc.width = w;
    ofc.height = h;
    const octx = ofc.getContext("2d");
    octx.font = measure.font;
    octx.textBaseline = "alphabetic";
    octx.fillStyle = "#fff";

    let x = 0;
    for (const ch of text) {
      octx.fillText(ch, x, ascent);
      x += octx.measureText(ch).width + letterSpacing;
    }

    const img = octx.getImageData(0, 0, w, h);
    const step = sampleStep();
    const next = [];

    for (let py = 0; py < h; py += step) {
      for (let px = 0; px < w; px += step) {
        if (img.data[(py * w + px) * 4 + 3] > 128) {
          next.push({
            x: px + (Math.random() - 0.5) * 2,
            y: py + (Math.random() - 0.5) * 2,
            homeX: px,
            homeY: py,
            vx: 0,
            vy: 0,
          });
        }
      }
    }
    particles = next;
  }

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const cx = touch ? touch.clientX : e.clientX;
    const cy = touch ? touch.clientY : e.clientY;
    const scaleX = rect.width ? w / rect.width : 1;
    const scaleY = rect.height ? h / rect.height : 1;
    mouseX = (cx - rect.left) * scaleX;
    mouseY = (cy - rect.top) * scaleY;
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = cachedColor;

    const hasMouse = mouseX > -9000;
    const repelRadius = config.repelRadius;
    const repelRadiusSq = repelRadius * repelRadius;
    const repelStrength = config.repelStrength;
    const spring = config.spring;
    const damping = config.damping;

    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];

      let targetX = p.homeX;
      let targetY = p.homeY;

      if (hasMouse) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const distSq = dx * dx + dy * dy;
        if (distSq < repelRadiusSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const force = (repelRadius - dist) / repelRadius;
          const smoothForce = force * force;
          const push = smoothForce * repelStrength;
          targetX += (dx / dist) * push;
          targetY += (dy / dist) * push;
        }
      }

      p.vx += (targetX - p.x) * spring;
      p.vy += (targetY - p.y) * spring;
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx;
      p.y += p.vy;

      ctx.beginPath();
      ctx.arc(p.x + dotSize / 2, p.y + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = isVisible ? requestAnimationFrame(animate) : null;
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(animate);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const onMove = (e) => {
    updatePointer(e);
  };
  const onLeave = () => {
    mouseX = -9999;
    mouseY = -9999;
  };

  hero.addEventListener("mousemove", onMove, { passive: true });
  hero.addEventListener("mouseleave", onLeave);
  hero.addEventListener("touchmove", onMove, { passive: true });
  hero.addEventListener("touchend", onLeave);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      isMobile = window.innerWidth < 768;
      dotSize = isMobile ? config.dotSizeMobile : config.dotSize;
      build();
    }, 180);
  });

  new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !document.hidden) start();
      else stop();
    },
    { threshold: 0 },
  ).observe(canvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (isVisible) start();
  });

  new MutationObserver(() => {
    cachedColor = readColor();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  build().then(start);
})();
