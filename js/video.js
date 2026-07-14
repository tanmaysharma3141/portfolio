(() => {
  function init() {
    document.querySelectorAll(".scroll-container").forEach((container) => {
      let isDown = false;
      let startX = 0;
      let startScroll = 0;

      container.addEventListener("mousedown", (e) => {
        isDown = true;
        startX = e.pageX;
        startScroll = container.scrollLeft;
      });
      const end = () => {
        isDown = false;
      };
      container.addEventListener("mouseleave", end);
      container.addEventListener("mouseup", end);
      container.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        container.scrollLeft = startScroll - (e.pageX - startX) * 2;
      });
    });

    // IntersectionObserver to auto-play/pause videos based on visibility
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".delayed-loop-video, .project-card-visual video").forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.setAttribute("loop", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("preload", "none");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("disableremoteplayback", "");
      video.setAttribute(
        "controlslist",
        "nodownload nofullscreen noremoteplayback noplaybackrate",
      );
      videoObserver.observe(video);
    });

    document.querySelectorAll(".delayed-loop-video").forEach((video) => {
      video.addEventListener("ended", () => {
        setTimeout(() => {
          video.currentTime = 0;
          video.play();
        }, 6000);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
