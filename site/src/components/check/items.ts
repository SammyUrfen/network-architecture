// Build-time lookups for the .astro wrappers. An island never imports this
// file: it reads the quiz collection and the curriculum files.
import { getCollection } from 'astro:content';
import type { QuizItem } from '../../lib/grade';
import type { SupportedItem } from './Question';

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

// Phase 2 builds the question types of the two pilot pages only (docs/PLAN.md section 4).
function supported(item: QuizItem): SupportedItem {
  if (item.type === 'order' || item.type === 'bytes' || (item.type === 'spot-bug' && item.code !== undefined)) {
    throw new Error(`${item.id}: the check components do not show a ${item.type} item${item.type === 'spot-bug' ? ' with code' : ''} yet.`);
  }
  return item;
}
