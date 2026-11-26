const searchForm = document.querySelector("form[role='search']");
const searchInput = searchForm.querySelector("input[type='search']");
const searchStatus = searchForm.querySelector("[role='status']");
const guide = document.querySelector("#guide");

const searchRoutes = [
  { queries: ["alien transformation tutorial"], href: "./loading.html" },
  { queries: ["a real alien", "real alien"], href: "./real-alien.html" },
  {
    queries: ["how aliens travel", "alien transportation", "ufo", "aliens vehicles"],
    href: "./alien-transportation.html",
  },
  {
    queries: ["alien affairs administration", "aaa"],
    href: "https://www.instagram.com/dancedanceevolution.gobelins/",
  },
  { queries: ["persona"], href: "./persona.html" },
];

document.querySelector(".nav [aria-haspopup='dialog']").addEventListener("click", () => guide.showModal());

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
  const route = searchRoutes.find(({ queries }) => queries.includes(query));

  if (route) {
    window.location.assign(route.href);
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
