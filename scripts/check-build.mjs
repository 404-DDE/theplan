import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, '.pages-dist');
const expected = ['.nojekyll', 'assets', 'index.html', 'loading.html',
  'tutorial.html', 'real-alien.html', 'alien-transportation.html', 'persona.html',
  'search.css', 'tutorial.css', 'image-page.css', 'visually-hidden.css',
  'search.js', 'loading.js', 'tutorial-media.js', 'tutorial-comments.js'];
assert.deepEqual((await readdir(dist)).sort(), expected.sort());

const assets = await readdir(join(dist, 'assets'));
for (const file of assets) {
  assert.deepEqual(await readFile(join(dist, 'assets', file)),
    await readFile(join(root, 'assets', file)), file);
}
for (const file of expected.filter(f => /\.(html|css|js)$/.test(f))) {
  const src = await readFile(join(dist, file), 'utf8');
  assert.ok(src.length, file);
  assert.ok(!src.includes('sourceMappingURL='), file);
  if (!file.endsWith('.js')) {
    for (const match of src.matchAll(/\.\/assets\/([\w.-]+)/g)) {
      assert.ok(assets.includes(match[1]), file + ': ' + match[1]);
    }
  }
}

const events = {};
const input = {
  value: '',
  addEventListener: (name, fn) => { events[name] = fn; },
  setAttribute() {}, removeAttribute() {}, focus() {}
};
const feedback = { textContent: '' };
const form = {
  querySelector: s => s.includes('input') ? input : feedback,
  addEventListener: (name, fn) => { events[name] = fn; }
};
let opened = false;
let href = '';
const guide = { showModal() { opened = true; } };
runInNewContext(await readFile(join(dist, 'search.js'), 'utf8'), {
  document: { querySelector: s => s === '#guide' ? guide :
    s.startsWith('form') ? form : { addEventListener: (name, fn) => { events[name] = fn; } } },
  window: { location: { assign: url => { href = url; } } }
});
events.click();
assert.ok(opened);
for (const [query, url] of [
  ['Alien transformation tutorial', './loading.html'],
  ['Real Alien', './real-alien.html'],
  ['A real alien', './real-alien.html'],
  ['How Aliens Travel', './alien-transportation.html'],
  ['Alien Transportation', './alien-transportation.html'],
  ['UFO', './alien-transportation.html'],
  ['Aliens Vehicles', './alien-transportation.html'],
  ['Alien Affairs Administration', 'https://www.instagram.com/dancedanceevolution.gobelins/'],
  ['AAA', 'https://www.instagram.com/dancedanceevolution.gobelins/'],
  ['  Ｐｅｒｓｏｎａ  ', './persona.html']
]) {
  input.value = query;
  events.submit({ preventDefault() {} });
  assert.equal(href, url, query);
}
input.value = 'not found';
href = '';
events.submit({ preventDefault() {} });
assert.equal(href, '');
assert.equal(feedback.textContent, '該当するスレッドはありません。');
events.input();
assert.equal(feedback.textContent, '');

let delay, destination;
runInNewContext(await readFile(join(dist, 'loading.js'), 'utf8'), {
  requestAnimationFrame: fn => fn(),
  setTimeout: (fn, ms) => { delay = ms; fn(); },
  window: { location: { replace: url => { destination = url; } } }
});
assert.equal(delay, 2000);
assert.equal(destination, './tutorial.html');
console.log('Build files, media and navigation checks passed.');
