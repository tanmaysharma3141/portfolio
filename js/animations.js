document.addEventListener("DOMContentLoaded", () => {
  // Scroll reveal
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  document
    .querySelectorAll(
      ".section-header, .project-card, .talk-card, .testimonial, .human-card, .fullbleed-video, .close-content",
    )
    .forEach((el) => {
      el.classList.add("fade-in");
      revealObserver.observe(el);
    });

  // Signature animation — re-triggers every time signature scrolls into view
  const signature = document.querySelector(".signature");
  if (signature) {
    const sigObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            signature.classList.remove("signing");
            void signature.offsetWidth;
            signature.classList.add("signing");
          } else {
            signature.classList.remove("signing");
          }
        });
      },
      { threshold: 0.5 },
    );
    sigObserver.observe(signature);
  }

  document.querySelectorAll(".talk-card-slideshow").forEach((slideshow) => {
    const imgs = slideshow.querySelectorAll(".slideshow-img");
    if (imgs.length < 2) return;

    let current = 0;
    let timer = null;
    let paused = document.hidden;

    const advance = () => {
      imgs[current].classList.remove("active");
      current = (current + 1) % imgs.length;
      imgs[current].classList.add("active");
      schedule(current === 0 ? 6000 : 3000);
    };

    function schedule(delay) {
      clearTimeout(timer);
      if (!paused) timer = setTimeout(advance, delay);
    }

    document.addEventListener("visibilitychange", () => {
      paused = document.hidden;
      if (paused) clearTimeout(timer);
      else schedule(3000);
    });

    schedule(3000);
  });
});
