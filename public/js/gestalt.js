(function () {
  const canvases = document.querySelectorAll(".gestalt-canvas");
  if (!canvases.length) return;

  canvases.forEach(initCanvas);

  function initCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const DEFAULTS = {
      dotSpacing: 26,
      dotSize: 2.3,
      dotMouseRadius: 150,
      dotRepel: 59,
      dotWaveAmp: 16,
      dotWaveSpeed: 1.1,
      dotAlphaBoost: 0.55,
      dotSizeBoost: 1.8,
    };
    const live = (key) => {
      const v = window.__humanize && window.__humanize[key];
      return typeof v === "number" ? v : DEFAULTS[key];
    };

    let w = 0,
      h = 0,
      cols = 0,
      rows = 0,
      lastSpacing = 0;
    let mouseX = -1000,
      mouseY = -1000;
    let pendingEvent = null;
    let rafId = null;
    let isVisible = true;
    let cachedColor = readColor();

    function readColor() {
      return (
        getComputedStyle(document.body).getPropertyValue("--on-dark").trim() ||
        "#ffffff"
      );
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sp = live("dotSpacing");
      lastSpacing = sp;
      cols = Math.ceil(w / sp) + 2;
      rows = Math.ceil(h / sp) + 2;
    }

    function applyPointer() {
      if (!pendingEvent) return;
      const rect = canvas.getBoundingClientRect();
      const e = pendingEvent;
      const touch = e.touches && e.touches[0];
      const cx = touch ? touch.clientX : e.clientX;
      const cy = touch ? touch.clientY : e.clientY;
      mouseX = cx - rect.left;
      mouseY = cy - rect.top;
      pendingEvent = null;
    }

    function drawDots(t) {
      ctx.fillStyle = cachedColor;

      const spacing = live("dotSpacing");
      const dotSize = live("dotSize");
      const mouseRadius = live("dotMouseRadius");
      const waveAmp = live("dotWaveAmp");
      const repelMax = live("dotRepel");
      const waveSpeed = live("dotWaveSpeed");
      const alphaBoost = live("dotAlphaBoost");
      const sizeBoost = live("dotSizeBoost");
      if (spacing !== lastSpacing) {
        lastSpacing = spacing;
        cols = Math.ceil(w / spacing) + 2;
        rows = Math.ceil(h / spacing) + 2;
      }

      const hasMouse = mouseX > -900;
      const mouseRadiusSq = mouseRadius * mouseRadius;
      const ts = t * waveSpeed;
      const t06 = ts * 0.6;
      const t05 = ts * 0.5;
      const t04 = ts * 0.4;

      for (let row = 0; row < rows; row++) {
        const y = row * spacing;
        const y005 = y * 0.005;
        const y009 = y * 0.009;
        const y004 = y * 0.004;

        for (let col = 0; col < cols; col++) {
          const x = col * spacing;

          const waveX = Math.sin(x * 0.01 - t06 + y005) * waveAmp;
          const waveY = Math.cos(y009 - t05 + x * 0.004) * waveAmp;

          let px = x + waveX;
          let py = y + waveY;
          let alpha = 0.35 + Math.sin(x * 0.006 - t04 + y004) * 0.12;
          let size = dotSize;

          if (hasMouse) {
            const mDx = x - mouseX;
            const mDy = y - mouseY;
            const distSq = mDx * mDx + mDy * mDy;
            if (distSq < mouseRadiusSq) {
              const dist = Math.sqrt(distSq) || 0.0001;
              const influence = 1 - dist / mouseRadius;
              const smooth = influence * influence * influence;
              const repel = smooth * repelMax;
              px += (mDx / dist) * repel;
              py += (mDy / dist) * repel;
              alpha += smooth * alphaBoost;
              size += smooth * sizeBoost;
            }
          }

          if (alpha < 0.15) alpha = 0.15;
          else if (alpha > 1) alpha = 1;

          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(px, py, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function animate(timestamp) {
      applyPointer();
      ctx.clearRect(0, 0, w, h);
      drawDots(timestamp * 0.001);
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
      pendingEvent = e;
    };
    const onLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
      pendingEvent = null;
    };

    canvas.addEventListener("mousemove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onLeave);
    window.addEventListener("resize", resize);

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

    resize();
    start();
  }
})();
