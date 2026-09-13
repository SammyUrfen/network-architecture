// Gate check 7 in docs/PLAN.md section 5. No MDX parser: regular
// expressions drop the frontmatter, imports, code and JSX tags, and ste-lint
// scores the prose that is left.
//   npm run lint:prose -- <module-id>   one module
//   npm run lint:prose                  every module
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FRONTMATTER, listFiles } from './verify-content.mjs';

const STE_LINT = join(homedir(), '.claude/skills/asd-ste100/scripts/ste-lint.py');
// The prose budget of gate check 7: under 2.5 violations per 100 words.
const FAIL_OVER = '2.5';

export function stripMdx(text) {
  return text
    .replace(FRONTMATTER, '')
    .replace(/^import .*$/gm, '')
    .replace(/^[ \t]*(`{3,}|~{3,})[\s\S]*?^[ \t]*\1.*$/gm, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/<\/?[A-Za-z][^>]*>/g, '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = process.argv[2];
  const all = listFiles(fileURLToPath(new URL('../src/content/modules', import.meta.url)), '.mdx');
  const files = id ? all.filter((file) => basename(file, '.mdx') === id) : all;
  if (id && files.length === 0) {
    console.error(`lint:prose: no module page with the ID ${id}`);
    process.exit(1);
  }
  let failed = 0;
  for (const file of files) {
    const run = spawnSync('python3', [STE_LINT, '--fail-over', FAIL_OVER], {
      input: stripMdx(readFileSync(file, 'utf8')),
      encoding: 'utf8',
    });
    const name = relative(process.cwd(), file);
    if (run.status === 0) {
      const { total_per100w: score, words } = JSON.parse(run.stdout);
      console.log(`${name}: ${score} per 100 words, ${words} words`);
    } else {
      failed++;
      console.log(`${name}: FAIL over ${FAIL_OVER} per 100 words`);
      console.log(run.stdout || run.stderr || run.error?.message);
    }
  }
  console.log(`lint:prose: ${files.length} modules, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}
