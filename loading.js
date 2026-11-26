requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => window.location.replace("./tutorial.html"), 2000);
  });
});
