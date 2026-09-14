// Build-time lookups for the .astro wrappers. An island never imports this
// file: it reads the quiz collection and the curriculum files.
import { getCollection, getEntry } from 'astro:content';
import type { QuizItem } from '../../lib/grade';
import { moduleHref } from '../../lib/url';
import type { SupportedItem } from './Question';
import { taughtInLabel, type TaughtIn } from './taught';

// The misconception bullets of docs/curriculum, with the line pattern of
// scripts/verify-content.mjs, plus the quoted statement.
const MISCONCEPTION = /^- (S\d\d-M\d+)(?: \([^)]*\))?: "(.*?)"(?=\s|$)/gm;
const curriculum = import.meta.glob<string>('../../../../docs/curriculum/session-*.md', { query: '?raw', import: 'default', eager: true });
const statements = new Map<string, string>();
for (const text of Object.values(curriculum)) {
  for (const [, id, statement] of text.matchAll(MISCONCEPTION)) if (!statements.has(id)) statements.set(id, statement);
}

/** The statement of each misconception ID in the items, such as "One read() returns one whole message." */
export function misconceptionsOf(items: QuizItem[]): Record<string, string> {
  const ids = items.flatMap((item) => [
    ...('options' in item ? (item.options ?? []) : []),
    ...('distractors' in item ? (item.distractors ?? []) : []),
  ]);
  return Object.fromEntries(ids.flatMap(({ misconception: id }) => (id ? [[id, statements.get(id) ?? id]] : [])));
}

/** The quiz items of one module that have `use`, in file order. The build fails when there is none. */
export async function itemsFor(module: string, use: QuizItem['use'][number]): Promise<SupportedItem[]> {
  const entry = (await getCollection('quiz')).find((quiz) => quiz.id === module);
  const items = entry?.data.items.filter((item) => item.use.includes(use)) ?? [];
  if (items.length === 0) throw new Error(`No quiz item with use "${use}" in src/content/quiz/${module}.yaml.`);
  return items.map(supported);
}

/** One quiz item by its ID. The build fails when the item does not exist. */
export async function itemById(id: string): Promise<SupportedItem> {
  const item = (await getCollection('quiz')).flatMap((quiz) => quiz.data.items).find((i) => i.id === id);
  if (!item) throw new Error(`No quiz item ${id} in src/content/quiz/.`);
  return supported(item);
}

/**
 * The "Taught in" link of an item: its module page, then the `taughtIn`
 * anchor. Undefined when the item has no `taughtIn`, or when its quiz file
 * has no module page (a quiz pack). The build fails when the page has no part
 * and no KeyIdea with that anchor, so a link never points at nothing.
 */
export async function taughtInOf(item: QuizItem): Promise<TaughtIn | undefined> {
  if (!item.taughtIn) return undefined;
  const quiz = (await getCollection('quiz')).find(({ data }) => data.items.some((i) => i.id === item.id));
  const page = quiz && (await getEntry('modules', quiz.id));
  if (!page) return undefined;
  const label = taughtInLabel(page.body ?? '', item.taughtIn);
  if (!label) throw new Error(`${item.id}: taughtIn ${item.taughtIn} is not a KeyIdea id or a part anchor of ${page.id}.`);
  return { href: `${moduleHref(page.id)}#${item.taughtIn}`, label };
}

/** The "Taught in" link of each item that has one, by item ID. */
export async function taughtInByItem(items: QuizItem[]): Promise<Record<string, TaughtIn>> {
  const links = await Promise.all(items.map(async (item) => [item.id, await taughtInOf(item)] as const));
  return Object.fromEntries(links.filter((link): link is readonly [string, TaughtIn] => link[1] !== undefined));
}

// Phase 2 builds the question types of the two pilot pages only (docs/PLAN.md section 4).
function supported(item: QuizItem): SupportedItem {
  if (item.type === 'order' || item.type === 'bytes' || (item.type === 'spot-bug' && item.code !== undefined)) {
    throw new Error(`${item.id}: the check components do not show a ${item.type} item${item.type === 'spot-bug' ? ' with code' : ''} yet.`);
  }
  return item;
}
