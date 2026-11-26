const backdrop = document.querySelector(".tutorial-backdrop");
const [intro, firstStep, ...finalSteps] = document.querySelectorAll("[data-animation]");

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
      poster.classList.remove("cropped-animation");
      poster.width = 1920;
      poster.height = 1080;
    }
    poster.src = source;
    return;
  }
}

async function loadAnimations() {
  await backdrop.decode().catch(() => {});
  await playAnimation(intro);
  await playAnimation(firstStep);
  await Promise.all(finalSteps.map(playAnimation));
}

loadAnimations();
