const delayMs = 2000;

// Give the loading screen a frame to paint before starting its timer.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => window.location.replace("./tutorial.html"), delayMs);
  });
});
