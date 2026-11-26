// 等加载页画出来再计时。
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => window.location.replace("./tutorial.html"), 2000);
  });
});
