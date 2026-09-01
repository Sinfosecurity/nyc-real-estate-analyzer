import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (!existsSync('dist/index.html') || !existsSync('dist/404.html')) {
  throw new Error('dist/index.html and dist/404.html are required. Run npm run build first.');
}

const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
const dir = mkdtempSync(join(tmpdir(), 'nyc-pages-'));

function run(command, cwd = dir) {
  execSync(command, { cwd, stdio: 'inherit' });
}

try {
  run('git init -b gh-pages');
  cpSync('dist', dir, { recursive: true });
  writeFileSync(join(dir, '.nojekyll'), '');
  run('git add -A');
  run('git commit -m "Publish GitHub Pages beta build"');
  run(`git remote add origin ${remote}`);
  run('git push --force origin gh-pages');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
