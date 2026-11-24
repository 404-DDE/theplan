const searchForm = document.querySelector("#thread-search");
const searchInput = document.querySelector("#query");
const searchStatus = document.querySelector("#search-status");
const guide = document.querySelector("#guide");
const transportationQueries = new Set([
  "how aliens travel",
  "alien transportation",
  "ufo",
  "aliens vehicles",
]);

document.querySelector("#open-guide").addEventListener("click", () => guide.showModal());

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

  if (query === "alien transformation tutorial") {
    window.location.assign("./loading.html");
    return;
  }

  if (query === "a real alien" || query === "real alien") {
    window.location.assign("./real-alien.html");
    return;
  }

  if (transportationQueries.has(query)) {
    window.location.assign("./alien-transportation.html");
    return;
  }

  if (query === "alien affairs administration" || query === "aaa") {
    window.location.assign("https://www.instagram.com/dancedanceevolution.gobelins/");
    return;
  }

  searchInput.setAttribute("aria-invalid", "true");
  searchStatus.textContent = "該当するスレッドはありません。";
  searchInput.focus();
});

searchInput.addEventListener("input", () => {
  searchInput.removeAttribute("aria-invalid");
  searchStatus.textContent = "";
});
