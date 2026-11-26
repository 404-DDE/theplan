import { readFileSync, writeFileSync } from "node:fs";

const loadingPage = new URL("../loading.html", import.meta.url);
const tutorialPage = new URL("../tutorial.html", import.meta.url);
const stylesheet = new URL("../tutorial.css", import.meta.url);
const tutorial = readFileSync(tutorialPage, "utf8");

const stylesheetHref = tutorial.match(/<link\s+rel="stylesheet"\s+href="(\.\/tutorial\.css(?:\?[^"]+)?)"\s*>/)?.[1];
const mobileSource = tutorial.match(/<source\s+media="(\(max-width: \d+px\))"\s+srcset="([^"\s]+)"/);
const desktopBackdrop = tutorial.match(/<img\s+class="tutorial-backdrop"\s+src="([^"]+)"/)?.[1];
const introPoster = tutorial.match(/<img\s+class="tutorial-animation intro-animation"\s+src="([^"]+)"/)?.[1];

if (!stylesheetHref || !mobileSource || !desktopBackdrop || !introPoster) {
  throw new Error("Could not find the stylesheet, backdrops, or intro poster in tutorial.html.");
}

const [, mobileMedia, mobileBackdrop] = mobileSource;
const preloads = [
  `  <link rel="prefetch" href="${stylesheetHref}" as="style">`,
  `  <link rel="preload" href="${mobileBackdrop}" as="image" media="${mobileMedia}" fetchpriority="high">`,
  `  <link rel="preload" href="${desktopBackdrop}" as="image" media="not all and ${mobileMedia}" fetchpriority="high">`,
  `  <link rel="preload" href="${introPoster}" as="image">`,
];

const loading = readFileSync(loadingPage, "utf8");
const css = readFileSync(stylesheet, "utf8");
const preloadBlock = /^(  <!-- Tutorial asset preloads -->(\r?\n))[\s\S]*?(^  <!-- End tutorial asset preloads -->)/m;
const mobileRule = /^(\/\* Tutorial mobile breakpoint from tutorial\.html\. \*\/\r?\n)@media \(max-width: \d+px\) \{/m;

if (!preloadBlock.test(loading) || !mobileRule.test(css)) {
  throw new Error("Could not find the tutorial preload block or mobile breakpoint to update.");
}

const updatedLoading = loading.replace(preloadBlock, (_, start, newline, end) => {
  return start + preloads.join(newline) + newline + end;
});
const updatedCss = css.replace(mobileRule, (_, comment) => `${comment}@media ${mobileMedia} {`);

if (updatedLoading !== loading) writeFileSync(loadingPage, updatedLoading);
if (updatedCss !== css) writeFileSync(stylesheet, updatedCss);
