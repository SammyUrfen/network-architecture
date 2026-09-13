// The content gate. It checks the nine rules of "What `npm run verify`
// checks" in docs/PLAN.md section 5, and prints one line for each failure.
// The curriculum files stay the single source of truth: this script reads
// only the four line patterns below from them, never a copy.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const CLAIM = /^\| (S\d\d-C\d+) \|/;
const MISCONCEPTION = /^- (S\d\d-M\d+)(?: \([^)]*\))?: "/;
const PLANNED_MODULE = /^### (s\d\d-m\d\d-[a-z0-9-]+)$/;
const THREAD = /^\| `(T-[a-z-]+)` \|/;
export const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

// A bullet such as `- S05-M03 appears again in checks 3 and 4.` has no
// `: "` after the ID, so MISCONCEPTION skips it: it is a reference, not a
// definition.
export function parseSession(text) {
  const claims = new Map(); // claim ID -> kind, the last cell of the row
  const misconceptions = new Set();
  const modules = [];
  for (const line of text.split(/\r?\n/)) {
    let match;
    if ((match = CLAIM.exec(line))) claims.set(match[1], line.trimEnd().split('|').at(-2).trim());
    else if ((match = MISCONCEPTION.exec(line))) misconceptions.add(match[1]);
    else if ((match = PLANNED_MODULE.exec(line))) modules.push(match[1]);
  }
  return { claims, misconceptions, modules };
}

export function parseThreads(text) {
  return new Set(text.split(/\r?\n/).flatMap((line) => THREAD.exec(line)?.[1] ?? []));
}

export function loadCurriculum(dir) {
  const sessions = {}; // "01" -> { file, claims, misconceptions, modules }
  for (const name of readdirSync(dir).sort()) {
    const number = /^session-(\d\d)\.md$/.exec(name)?.[1];
    if (number) sessions[number] = { file: join(dir, name), ...parseSession(readFileSync(join(dir, name), 'utf8')) };
  }
  return { sessions, threads: parseThreads(readFileSync(join(dir, 'README.md'), 'utf8')) };
}

// A missing folder is an empty folder: before the first packet, and in a
// fresh worktree, the content folders do not exist yet.
export function listFiles(dir, extension) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .filter((name) => name.endsWith(extension))
    .sort()
    .map((name) => join(dir, name));
}

const list = (value) => (Array.isArray(value) ? value : []);

export function verify(contentDir, curriculumDir) {
  const failures = [];
  const fail = (file, rule, message) => failures.push({ file, rule, message });

  const { sessions, threads } = loadCurriculum(curriculumDir);
  const planned = new Set(Object.values(sessions).flatMap((session) => session.modules));
  // "S01-C92" and "s01-m08-framing" both carry the session number at 1..3.
  const sessionOf = (id) => sessions[String(id).slice(1, 3)];

  const parseYaml = (file, source) => {
    try {
      const data = parse(source);
      if (data && typeof data === 'object') return data;
      fail(file, 'parse', 'expected a YAML mapping');
    } catch (error) {
      fail(file, 'parse', error.message.split('\n')[0]);
    }
    return null;
  };

  const modules = listFiles(join(contentDir, 'modules'), '.mdx').flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    const match = FRONTMATTER.exec(text);
    if (!match) {
      fail(file, 'parse', 'no frontmatter');
      return [];
    }
    const data = parseYaml(file, match[1]);
    return data ? [{ file, data, text, body: text.slice(match[0].length) }] : [];
  });

  // One quiz or card file per module. Its ID is the file name.
  const itemFiles = (folder) =>
    listFiles(join(contentDir, folder), '.yaml').flatMap((file) => {
      const data = parseYaml(file, readFileSync(file, 'utf8'));
      const items = list(data?.items).filter((item) => item && typeof item === 'object');
      return data ? [{ file, id: basename(file, '.yaml'), items }] : [];
    });
  const quizFiles = itemFiles('quiz');
  const cardFiles = itemFiles('cards');

  // Rule 1
  const checkCovers = (file, owner, covers) => {
    for (const id of list(covers)) {
      if (!sessionOf(id)?.claims.has(id)) fail(file, 1, `${owner}: ${id} is not in the claim table of its session`);
    }
  };

  for (const { file, data, text } of modules) {
    checkCovers(file, data.id, data.covers);
    // Rule 3
    for (const id of list(data.prereqs)) {
      if (!planned.has(id)) fail(file, 3, `prereq ${id} is not a planned module`);
    }
    for (const id of list(data.threads)) {
      if (!threads.has(id)) fail(file, 3, `thread ${id} is not in the thread table`);
    }
    // Rule 8
    text.split(/\r?\n/).forEach((line, index) => {
      if (line.includes('](/')) fail(file, 8, `line ${index + 1}: root-relative Markdown link, use ModuleLink`);
    });
  }

  for (const { file, items } of quizFiles) {
    // Rule 9. An item with no right option already fails rule 4, so it does not count here.
    const rightIndexes = items
      .filter((item) => item.type === 'mcq' || item.type === 'predict')
      .map((item) => list(item.options).findIndex((option) => option?.correct === true))
      .filter((index) => index >= 0);
    if (rightIndexes.length >= 3 && rightIndexes.every((index) => index === rightIndexes[0])) {
      fail(file, 9, `the right option is option ${rightIndexes[0] + 1} in all ${rightIndexes.length} mcq and predict items, vary its position`);
    }
    for (const item of items) {
      checkCovers(file, item.id, item.covers);
      // Rule 2
      for (const choice of [...list(item.options), ...list(item.distractors)]) {
        const id = choice?.misconception;
        if (id && !sessionOf(id)?.misconceptions.has(id)) {
          fail(file, 2, `${item.id}: misconception ${id} is not defined in the curriculum file of its session`);
        }
      }
      // Rule 4
      if (item.type === 'mcq' || item.type === 'predict') {
        const options = list(item.options);
        const correct = options.filter((option) => option?.correct === true).length;
        if (options.length < 3 || options.length > 4) fail(file, 4, `${item.id}: ${options.length} options, needs 3 or 4`);
        if (correct !== 1) fail(file, 4, `${item.id}: ${correct} correct options, needs exactly 1`);
        options.forEach((option, index) => {
          if (option?.correct !== true && !(option?.misconception && option?.feedback)) {
            fail(file, 4, `${item.id}: wrong option ${index + 1} needs a misconception and a feedback`);
          }
        });
      }
    }
  }

  for (const { file, items } of cardFiles) {
    for (const card of items) checkCovers(file, card.id, card.covers);
  }

  // Rule 5. Only a ready module with an MDX page. A quiz pack has no page,
  // so this loop never sees it. Segments count in page order from 1.
  const quizById = new Map(quizFiles.map((quiz) => [quiz.id, quiz]));
  const cardsById = new Map(cardFiles.map((cards) => [cards.id, cards]));
  for (const { file, data, body } of modules) {
    if (data.status !== 'ready') continue;
    const quiz = quizById.get(data.id) ?? { file, items: [] };
    const withUse = (use) => quiz.items.filter((item) => list(item.use).includes(use));
    const range = (label, count, min, max) => {
      if (count < min || count > max) fail(file, 5, `${data.id}: ${count} ${label}, needs ${min} to ${max}`);
    };
    const checks = withUse('check');
    const segments = (body.match(/<Segment\b/g) ?? []).length;
    range('pretest items', withUse('pretest').length, 2, 3);
    range('checks', checks.length, 3, 6);
    range('exit items', withUse('exit').length, 2, 3);
    range('cards', cardsById.get(data.id)?.items.length ?? 0, 3, 8);
    for (let segment = 1; segment <= segments; segment++) {
      range(`checks in segment ${segment}`, checks.filter((item) => item.segment === segment).length, 1, 2);
    }
    for (const item of checks) {
      if (!(Number.isInteger(item.segment) && item.segment >= 1 && item.segment <= segments)) {
        fail(quiz.file, 5, `${item.id}: segment ${item.segment} is not one of the ${segments} <Segment> blocks`);
      }
    }
  }

  // Rule 6. Quiz item IDs and card IDs share one namespace.
  const seen = new Map();
  for (const { file, items } of [...quizFiles, ...cardFiles]) {
    for (const item of items) {
      if (seen.has(item.id)) fail(file, 6, `${item.id} is also in ${relative(contentDir, seen.get(item.id))}`);
      else seen.set(item.id, file);
    }
  }

  // Rule 7. A session with no planned modules is not "all ready".
  const ready = new Set(modules.filter((module) => module.data.status === 'ready').map((module) => module.data.id));
  const covered = new Set(modules.flatMap((module) => list(module.data.covers)));
  for (const session of Object.values(sessions)) {
    if (session.modules.length === 0 || !session.modules.every((id) => ready.has(id))) continue;
    for (const [id, kind] of session.claims) {
      if (kind === 'core' && !covered.has(id)) fail(session.file, 7, `core claim ${id} is not covered by any module`);
    }
  }

  const all = Object.values(sessions);
  const sum = (count) => all.reduce((total, session) => total + count(session), 0);
  const counts = {
    sessions: all.length,
    plannedModules: sum((session) => session.modules.length),
    claims: sum((session) => session.claims.size),
    misconceptions: sum((session) => session.misconceptions.size),
    threads: threads.size,
    pages: modules.length,
    quizItems: quizFiles.reduce((total, quiz) => total + quiz.items.length, 0),
    cards: cardFiles.reduce((total, cards) => total + cards.items.length, 0),
  };
  return { failures, counts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const here = (path) => fileURLToPath(new URL(path, import.meta.url));
  const { failures, counts } = verify(here('../src/content'), here('../../docs/curriculum'));
  for (const { file, rule, message } of failures) {
    console.log(`${relative(process.cwd(), file)}: ${rule === 'parse' ? 'parse error' : `rule ${rule}`}: ${message}`);
  }
  console.log(
    `verify: ${counts.sessions} sessions, ${counts.plannedModules} planned modules, ${counts.claims} claims, ` +
      `${counts.misconceptions} misconceptions, ${counts.threads} threads | ` +
      `${counts.pages} module pages, ${counts.quizItems} quiz items, ${counts.cards} cards | ${failures.length} failures`,
  );
  process.exit(failures.length > 0 ? 1 : 0);
}
