const form = document.getElementById("search-form");
const input = document.getElementById("search-query");
const feedback = document.getElementById("search-status");
const guide = document.getElementById("guide");

const routes = [
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

document.getElementById("guide-button").addEventListener("click", () => guide.showModal());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
  const route = routes.find(({ queries }) => queries.includes(query));

  if (route) {
    window.location.assign(route.href);
    return;
  }

  input.setAttribute("aria-invalid", "true");
  feedback.textContent = "該当するスレッドはありません。";
  input.focus();
});

input.addEventListener("input", () => {
  input.removeAttribute("aria-invalid");
  feedback.textContent = "";
});
