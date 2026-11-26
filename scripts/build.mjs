import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { minify as minifyHTML } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import { minify as minifyJS } from 'terser';
import Obfuscator from 'javascript-obfuscator';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, '.pages-dist');
const html = ['index.html', 'loading.html', 'tutorial.html', 'real-alien.html',
  'alien-transportation.html', 'persona.html'];
const css = ['search.css', 'tutorial.css', 'image-page.css', 'visually-hidden.css'];
const js = ['search.js', 'loading.js', 'tutorial-media.js', 'tutorial-comments.js'];
const assets = [
  'P1_cloud_ALL.png', 'P1_theplan.png', 'P2_loading.png', 'P3_bg.png',
  'P3_mobile.png', 'P3_preview.png',
  'WEBGIF1-poster.png', 'WEBGIF1.gif', 'WEBGIF2-poster.png', 'WEBGIF2.gif',
  'WEBGIF3-poster.png', 'WEBGIF3.gif', 'WEBGIF3.webp',
  'WEBGIF4-poster.png', 'WEBGIF4.gif', 'WEBGIF4.webp',
  'adachi_true.gif', 'miku_watchingyou.jpg', 'rinredbull.mp4'
];

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'assets'), { recursive: true });

for (const file of html) {
  const src = await readFile(join(root, file), 'utf8');
  const out = await minifyHTML(src, {
    removeComments: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    keepClosingSlash: true,
    minifyCSS: { level: 0, rebase: false },
    minifyJS: false
  });
  await writeFile(join(dist, file), out);
}

for (const file of css) {
  const src = await readFile(join(root, file), 'utf8');
  const out = new CleanCSS({ level: 0, rebase: false, inline: ['none'] }).minify(src);
  if (out.errors.length) throw new Error(out.errors.join('\n'));
  await writeFile(join(dist, file), out.styles);
}

for (const file of js) {
  const src = await readFile(join(root, file), 'utf8');
  const module = file.startsWith('tutorial-');
  const compressed = await minifyJS(src, {
    module,
    compress: { passes: 1 },
    mangle: true,
    sourceMap: false
  });
  const out = Obfuscator.obfuscate(compressed.code, {
    target: 'browser',
    compact: true,
    seed: 404,
    renameGlobals: false,
    renameProperties: false,
    identifierNamesGenerator: 'mangled',
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    selfDefending: false,
    simplify: false,
    stringArray: true,
    stringArrayThreshold: 0.45,
    stringArrayEncoding: [],
    unicodeEscapeSequence: false,
    sourceMap: false
  }).getObfuscatedCode();
  execFileSync(process.execPath, ['--input-type=' + (module ? 'module' : 'commonjs'), '--check'], { input: out });
  await writeFile(join(dist, file), out);
}

for (const file of assets) {
  await copyFile(join(root, 'assets', file), join(dist, 'assets', file));
}
await writeFile(join(dist, '.nojekyll'), '');
console.log('Pages build ready: ' + dist);
