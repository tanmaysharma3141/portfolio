(() => {
  const sections = document.querySelectorAll(".apple-work, .past-work");
  if (!sections.length) return;

  const prevIcon =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const nextIcon =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sections.forEach((section) => {
    const header = section.querySelector(".section-header");
    const container = section.querySelector(".scroll-container");
    if (!header || !container) return;

    const nav = document.createElement("div");
    nav.className = "scroll-nav";
    nav.setAttribute("aria-hidden", "false");
    nav.innerHTML = `
            <button type="button" class="scroll-nav-btn scroll-nav-prev" aria-label="Scroll projects left">${prevIcon}</button>
            <div class="scroll-nav-progress" aria-hidden="true"><span class="scroll-nav-progress-fill"></span></div>
            <button type="button" class="scroll-nav-btn scroll-nav-next" aria-label="Scroll projects right">${nextIcon}</button>
        `;
    header.appendChild(nav);

    const prev = nav.querySelector(".scroll-nav-prev");
    const next = nav.querySelector(".scroll-nav-next");
    const fill = nav.querySelector(".scroll-nav-progress-fill");

    function step(direction) {
      const delta = container.clientWidth * 0.85 * direction;
      container.scrollBy({ left: delta, behavior: "smooth" });
    }

    function updateState() {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      const atStart = scrollLeft <= 1;
      const atEnd = scrollLeft >= maxScroll - 1;
      prev.disabled = atStart;
      next.disabled = atEnd;
      if (maxScroll > 0 && fill) {
        const ratio = Math.min(1, Math.max(0, scrollLeft / maxScroll));
        fill.style.transform = `scaleX(${ratio || 0.02})`;
      } else if (fill) {
        fill.style.transform = "scaleX(0.02)";
      }
      nav.classList.toggle("is-hidden", maxScroll <= 0);
    }

    let scheduled = false;
    function scheduleUpdate() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        updateState();
      });
    }

    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    container.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(scheduleUpdate);
      ro.observe(container);
    }

    updateState();
  });
})();
