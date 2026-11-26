const backdrop = document.querySelector(".tutorial-backdrop");
const intro = document.querySelector("[data-animation-stage='intro']");
const firstStep = document.querySelector("[data-animation-stage='team']");
const finalSteps = document.querySelectorAll("[data-animation-stage='final']");

async function playAnimation(poster) {
  const animation = new Image();
  const { animation: src, fallback } = poster.dataset;
  const sources = [src, fallback].filter(Boolean);

  for (const source of sources) {
    animation.src = source;
    try {
      await animation.decode();
    } catch {
      continue;
    }

    if (source === fallback) {
      poster.classList.remove("cropped-animation");
      poster.width = animation.naturalWidth;
      poster.height = animation.naturalHeight;
    }
    poster.src = source;
    return;
  }

  console.warn("Could not load tutorial animation", sources.join(", "));
}

async function loadAnimations() {
  await backdrop.decode().catch((error) => {
    console.warn("Could not load tutorial backdrop", backdrop.currentSrc || backdrop.src, error);
  });
  await playAnimation(intro);
  await playAnimation(firstStep);
  await Promise.all(Array.from(finalSteps, playAnimation));
}

loadAnimations();
