import { readdir, readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const walk = async dir => (await Promise.all((await readdir(dir)).map(async name => {
  const path = `${dir}/${name}`; return (await stat(path)).isDirectory() ? walk(path) : [path];
}))).flat();
const files = await walk('dist');
assert(files.length <= 256, 'Export exceeds 256 files');
const allowed = new Set(['html','css','js','json','svg']);
const contents = [];
for (const path of files) {
  assert(allowed.has(path.split('.').pop()), `Unsupported static type: ${path}`);
  const content = await readFile(path,'utf8');
  assert(Buffer.byteLength(content) <= 1_000_000, `Oversized file: ${path}`);
  contents.push({ path: path.slice(5), content });
}
const serialized = Buffer.byteLength(JSON.stringify(contents));
assert(serialized < 2_900_000, 'Snapshot lacks sufficient room below 3 MB');
const manifest = JSON.parse(await readFile('dist/claus.json','utf8'));
assert.equal(manifest.schema, 'claus-project/1');
assert.deepEqual(manifest.connect, ['https://claus.si','https://claus-network-api.vercel.app']);
assert(Buffer.byteLength(JSON.stringify(manifest)) <= 4096);
const html = await readFile('dist/index.html','utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) assert(files.includes(`dist/${match[1].slice(2)}`), `Missing local asset ${match[1]}`);
assert(!/<form\b/i.test(html), 'Forms are not allowed');
assert(!/type="module"/.test(html), 'Use the classic bundle in the opaque host');
assert(!/(?:src|href)="\/(?!\/)/.test(html), 'Root-relative assets break gateway paths');
for (const attribute of ['<title>', 'rel="icon"', 'name="description"','property="og:title"','property="og:image"']) assert(html.includes(attribute), `Missing ${attribute}`);
console.log(JSON.stringify({ result:'pass', files:files.length, bytes:contents.reduce((n,f)=>n+Buffer.byteLength(f.content),0), serializedBytes:serialized, largestFile:Math.max(...contents.map(f=>Buffer.byteLength(f.content))), origins:manifest.connect },null,2));
