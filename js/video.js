document.addEventListener("DOMContentLoaded", () => {
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

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (video.preload === "none") {
            video.preload = "auto";
            video.load();
          }
          const p = video.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0, rootMargin: "0px 200px 0px 200px" },
  );

  document.querySelectorAll("video").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.controls = false;
    video.setAttribute("disablepictureinpicture", "");
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
});
