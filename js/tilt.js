(function () {
  if (!window.matchMedia) return;
  if (!window.matchMedia("(hover: hover)").matches) return;
  if (window.matchMedia("(max-width: 734px)").matches) return;

  const cards = document.querySelectorAll(
    ".talk-card, .human-card, .fullbleed-video-wrap, .testimonial",
  );
  if (!cards.length) return;

  const config = {
    maxTilt: 14,
    perspective: 800,
    ease: 0.22,
    restThreshold: 0.01,
    hoverScale: 1.035,
    springStiffness: 0.14,
    springDamping: 0.72,
  };

  cards.forEach((card) => {
    const maxTilt = parseFloat(card.dataset.tilt) || config.maxTilt;
    const perspective =
      parseFloat(card.dataset.perspective) || config.perspective;
    const ease = parseFloat(card.dataset.ease) || config.ease;

    let rafId = null;
    let targetRx = 0,
      targetRy = 0;
    let currentRx = 0,
      currentRy = 0;
    let targetScale = 1;
    let currentScale = 1;
    let scaleVel = 0;
    let active = false;
    let pendingEvent = null;
    let cachedRect = null;

    function applyTransform() {
      card.style.transform = `perspective(${perspective}px) rotateX(${currentRx.toFixed(3)}deg) rotateY(${currentRy.toFixed(3)}deg) scale(${currentScale.toFixed(4)})`;
    }

    function consumePointer() {
      if (!pendingEvent) return;
      if (!cachedRect) cachedRect = card.getBoundingClientRect();
      const relX = (pendingEvent.clientX - cachedRect.left) / cachedRect.width;
      const relY = (pendingEvent.clientY - cachedRect.top) / cachedRect.height;
      targetRy = (relX - 0.5) * maxTilt * 2;
      targetRx = -(relY - 0.5) * maxTilt * 2;
      pendingEvent = null;
    }

    function animate() {
      consumePointer();

      const dx = targetRx - currentRx;
      const dy = targetRy - currentRy;
      currentRx += dx * ease;
      currentRy += dy * ease;

      scaleVel += (targetScale - currentScale) * config.springStiffness;
      scaleVel *= config.springDamping;
      currentScale += scaleVel;

      applyTransform();

      const rotSettled =
        Math.abs(dx) < config.restThreshold &&
        Math.abs(dy) < config.restThreshold;
      const scaleSettled =
        Math.abs(targetScale - currentScale) < 0.0005 &&
        Math.abs(scaleVel) < 0.0005;

      if (!rotSettled || !scaleSettled || active) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
        if (!active) {
          currentScale = 1;
          scaleVel = 0;
          card.style.transform = "";
          cachedRect = null;
        }
      }
    }

    function schedule() {
      if (rafId === null) rafId = requestAnimationFrame(animate);
    }

    card.addEventListener("mouseenter", () => {
      active = true;
      targetScale = config.hoverScale;
      cachedRect = card.getBoundingClientRect();
      card.classList.add("is-tilting");
      schedule();
    });

    card.addEventListener(
      "mousemove",
      (e) => {
        pendingEvent = e;
        schedule();
      },
      { passive: true },
    );

    card.addEventListener("mouseleave", () => {
      active = false;
      targetRx = 0;
      targetRy = 0;
      targetScale = 1;
      pendingEvent = null;
      card.classList.remove("is-tilting");
      schedule();
    });
  });
})();
