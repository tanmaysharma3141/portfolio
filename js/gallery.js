(() => {
  const INDICES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 18, 10, 11, 12, 13, 14, 15, 16, 17,
  ];
  const BASE = "assets/images/workshop-gallery";
  const captions = [
    "Workshop kickoff with participants",
    "Leading the interaction design exercise",
    "Teaching session in progress",
    "Group collaboration during the workshop",
    "Participants working through design prompts",
    "Q&A with workshop attendees",
    "Hands-on prototyping exercise",
    "Walk-through of design principles",
    "One-on-one feedback session",
    "Group photo with workshop attendees",
    "Audience during keynote",
    "Live demo of interaction patterns",
    "Mentoring moment",
    "Post-workshop discussion",
    "Closing session with participants",
    "Team reflection exercise",
    "Sketching interaction flows",
    "Behind-the-scenes moment",
  ];
  const images = INDICES.map((num, i) => {
    const idx = String(num).padStart(2, "0");
    return {
      full: `${BASE}/workshop-${idx}.webp`,
      thumb: `${BASE}/workshop-${idx}-sm.webp`,
      alt: captions[i] || `Workshop photo ${i + 1}`,
    };
  });

  const lightbox = document.getElementById("workshopGallery");
  if (!lightbox) return;
  const lightboxImg = lightbox.querySelector(".gallery-lightbox-img");
  const lightboxCounter = lightbox.querySelector(".gallery-lightbox-counter");
  const thumbStrip = lightbox.querySelector("#galleryLightboxThumbs");
  const triggers = document.querySelectorAll('[data-gallery="workshop"]');

  let current = 0;
  let lastFocus = null;
  let built = false;

  function buildThumbs() {
    if (built) return;
    const frag = document.createDocumentFragment();
    images.forEach((img, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-thumb";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `Show image ${i + 1}: ${img.alt}`);
      btn.dataset.index = String(i);
      const im = document.createElement("img");
      im.src = img.thumb;
      im.alt = "";
      im.loading = "lazy";
      im.decoding = "async";
      btn.appendChild(im);
      frag.appendChild(btn);
    });
    thumbStrip.appendChild(frag);
    built = true;
  }

  function updateThumbState() {
    const thumbs = thumbStrip.querySelectorAll(".gallery-thumb");
    thumbs.forEach((t, i) => {
      const active = i === current;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        t.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    });
  }

  function show(i) {
    current = (i + images.length) % images.length;
    const img = images[current];
    lightboxImg.src = img.full;
    lightboxImg.alt = img.alt;
    lightboxCounter.textContent = `${current + 1} / ${images.length}`;
    updateThumbState();
  }

  function open(startIndex = 0) {
    buildThumbs();
    lastFocus = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-open");
    show(startIndex);
    const closeBtn = lightbox.querySelector(".gallery-lightbox-close");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-open");
    lightboxImg.removeAttribute("src");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function next() {
    show(current + 1);
  }
  function prev() {
    show(current - 1);
  }

  triggers.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      open(0);
    });
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target.closest("[data-lightbox-close]")) {
      close();
      return;
    }
    if (e.target.closest("[data-lightbox-next]")) {
      next();
      return;
    }
    if (e.target.closest("[data-lightbox-prev]")) {
      prev();
      return;
    }
    const thumb = e.target.closest(".gallery-thumb");
    if (thumb) {
      show(Number(thumb.dataset.index));
      return;
    }
    if (
      !e.target.closest(
        ".gallery-lightbox-img, .gallery-lightbox-thumbs, .gallery-lightbox-counter",
      )
    ) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });

  const figure = lightbox.querySelector(".gallery-lightbox-figure");
  if (figure) {
    const SWIPE_THRESHOLD = 50;
    let touchStartX = 0;
    let touchStartY = 0;
    let tracking = false;

    figure.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) {
          tracking = false;
          return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        tracking = true;
      },
      { passive: true },
    );

    figure.addEventListener(
      "touchend",
      (e) => {
        if (!tracking) return;
        tracking = false;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy))
          return;
        if (dx < 0) next();
        else prev();
      },
      { passive: true },
    );

    figure.addEventListener(
      "touchcancel",
      () => {
        tracking = false;
      },
      { passive: true },
    );
  }
})();
