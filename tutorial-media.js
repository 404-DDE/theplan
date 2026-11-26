const backdrop = document.querySelector(".tutorial-backdrop");
const intro = document.querySelector("[data-animation-stage='intro']");
const firstStep = document.querySelector("[data-animation-stage='team']");
const finalSteps = document.querySelectorAll("[data-animation-stage='final']");

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
      poster.width = Number(poster.dataset.fallbackWidth ?? animation.naturalWidth);
      poster.height = Number(poster.dataset.fallbackHeight ?? animation.naturalHeight);
    }
    poster.src = source;
    return;
  }
}

async function loadAnimations() {
  await backdrop.decode().catch(() => {});
  await playAnimation(intro);
  await playAnimation(firstStep);
  await Promise.all(Array.from(finalSteps, playAnimation));
}

loadAnimations();
