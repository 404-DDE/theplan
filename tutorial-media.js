const backdrop = document.querySelector(".tutorial-backdrop");
const posters = document.querySelectorAll("[data-animation]");
const finalPair = document.querySelectorAll("[data-animation-pair]");

async function playAnimation(poster) {
  const animation = new Image();

  for (const source of [poster.dataset.animation, poster.dataset.fallback].filter(Boolean)) {
    animation.src = source;
    try {
      await animation.decode();
    } catch {
      continue;
    }

    if (source === poster.dataset.fallback) {
      poster.classList.remove("tutorial-gif-cropped");
      poster.width = 1920;
      poster.height = 1080;
    }
    poster.src = source;
    return;
  }
}

function observeAnimations() {
  if (!("IntersectionObserver" in window)) {
    posters.forEach(playAnimation);
    return;
  }

  const pending = new Set(posters);
  const observer = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;

      const nearby = target.hasAttribute("data-animation-pair") ? finalPair : [target];
      for (const poster of nearby) {
        if (!pending.delete(poster)) continue;
        observer.unobserve(poster);
        playAnimation(poster);
      }
    }
  }, { rootMargin: "64px 0px" });

  posters.forEach((poster) => observer.observe(poster));
}

// Start loading nearby animations after the backdrop can paint.
backdrop.decode().catch(() => {}).then(observeAnimations);
