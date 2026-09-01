import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const index = resolve('dist/index.html');
const fallback = resolve('dist/404.html');
if (!existsSync(index)) {
  throw new Error('dist/index.html missing; run Vite build first.');
}
copyFileSync(index, fallback);
