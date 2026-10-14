import { readFile, writeFile } from 'node:fs/promises';
const html = (await readFile('index.html', 'utf8')).replace(
  '<script type="module" src="./src/main.ts"></script>',
  '<link rel="stylesheet" href="./assets/style.css">\n    <script defer src="./assets/app.js"></script>'
);
await writeFile('dist/index.html', html);
