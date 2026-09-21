import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Links between entries are plain ID strings, not reference(). The verify
// script checks that each one exists (docs/PLAN.md section 3).
const claimId = z.string().regex(/^S\d\d-C\d+$/);
const misconceptionId = z.string().regex(/^S\d\d-M\d+$/);
// A lesson is s01-m08-framing. The one digest of a session is s01-digest.
const moduleId = z.string().regex(/^s\d\d-(m\d\d-[a-z0-9-]+|digest)$/);
const threadId = z.string().regex(/^T-[a-z-]+$/);

const sessions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/sessions' }),
  schema: z.object({
    number: z.number().int().min(1),
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    dateApprox: z.boolean().default(false),
    sourceStatus: z.enum(['complete', 'partial', 'missing']),
  }),
});

const modules = defineCollection({
  // Without generateId, the ID of s01/s01-m08-framing.mdx has the folder in it.
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/modules',
    generateId: ({ data }) => String(data.id),
  }),
  schema: z
    .object({
      id: moduleId,
      session: z.number().int().min(1),
      order: z.number().int().min(1),
      // A lesson page, or the fast read of a whole class (docs/PEDAGOGY.md
      // section 3). A file with no kind is a lesson.
      kind: z.enum(['lesson', 'digest']).default('lesson'),
      title: z.string(),
      // A lesson takes its minutes from its module section. A digest has no
      // module section, so its reading time comes from the digest contract.
      minutes: z.number().int().positive().optional(),
      bigIdea: z.string(),
      covers: z.array(claimId).min(1),
      prereqs: z.array(moduleId).default([]),
      threads: z.array(threadId).default([]),
      confidence: z.enum(['high', 'medium', 'low']),
      status: z.enum(['draft', 'ready']),
      terms: z.array(z.object({ term: z.string(), meaning: z.string() })).default([]),
    })
    .superRefine((module, ctx) => {
      if (module.kind === 'lesson' && module.minutes === undefined) {
        ctx.addIssue({ code: 'custom', path: ['minutes'], message: 'A lesson needs minutes.' });
      }
    }),
});

// The schema checks the shape of each question type. The content rules
// (option counts, exactly one correct option, a misconception on each wrong
// option) live in scripts/verify-content.mjs, rule 4.
const option = z.object({
  text: z.string(),
  correct: z.boolean(),
  misconception: misconceptionId.optional(),
  feedback: z.string(),
});
const distractors = <T extends z.ZodType>(value: T) =>
  z.array(z.object({ value, misconception: misconceptionId.optional(), feedback: z.string() })).optional();

const itemBase = {
  id: z.string().regex(/^s\d\d-(m\d\d|digest)-q\d+$/),
  use: z.array(z.enum(['pretest', 'check', 'exit', 'practice'])).min(1),
  segment: z.number().int().min(1).optional(),
  prompt: z.string(),
  explanation: z.string(),
  covers: z.array(claimId).min(1),
  tags: z.array(z.enum(['story', 'measured', 'beyond'])).default([]),
  // The anchor where the page teaches the answer: a <KeyIdea id="..."> or a
  // segment anchor. Optional here, required in a ready module (verify rule 10).
  taughtIn: z.string().optional(),
};

export const quizItem = z.discriminatedUnion('type', [
  z.object({ ...itemBase, type: z.enum(['mcq', 'predict', 'multi']), options: z.array(option) }),
  z.object({
    ...itemBase,
    type: z.literal('numeric'),
    answer: z.object({ value: z.number(), tolerance: z.number().min(0).default(0), unit: z.string().nullable() }),
    distractors: distractors(z.number()),
  }),
  z.object({
    ...itemBase,
    type: z.literal('order'),
    items: z.array(z.string()).min(2),
    distractors: distractors(z.array(z.string())),
  }),
  z
    .object({
      ...itemBase,
      type: z.literal('bytes'),
      answer: z.string().optional(),
      hex: z.string().optional(),
      field: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
      distractors: distractors(z.string()),
    })
    .refine((i) => (i.answer !== undefined) !== (i.hex !== undefined && i.field !== undefined), {
      message: 'A bytes item has either answer, or hex and field.',
    }),
  z
    .object({
      ...itemBase,
      type: z.literal('spot-bug'),
      code: z.string().optional(),
      bugLines: z.array(z.number().int().min(1)).optional(),
      options: z.array(option).optional(),
    })
    .refine((i) => (i.code !== undefined && i.bugLines !== undefined) !== (i.options !== undefined), {
      message: 'A spot-bug item has either code and bugLines, or options.',
    }),
  z.object({ ...itemBase, type: z.literal('recall'), model: z.string(), distractors: distractors(z.string()) }),
]);

// One quiz file and one card file per module. The entry ID is the module ID.
const quiz = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/quiz' }),
  schema: z.object({ items: z.array(quizItem) }),
});

const cards = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/cards' }),
  schema: z.object({
    items: z.array(
      z.object({
        id: z.string().regex(/^s\d\d-(m\d\d|digest)-c\d+$/),
        front: z.string(),
        back: z.string(),
        covers: z.array(claimId).min(1),
      }),
    ),
  }),
});

const assessments = defineCollection({
  loader: file('src/content/assessments.yaml'),
  schema: z.object({
    id: z.string(),
    kind: z.enum(['quiz', 'assignment', 'project', 'exam']),
    title: z.string(),
    weight: z.number().min(0).max(100),
    date: z.coerce.date().nullable(),
    dateApprox: z.boolean().default(false),
    coversSessions: z.array(z.number().int().min(1)),
    prepModules: z.array(moduleId).default([]),
  }),
});

// Reads the rows of the thread table, so the site keeps no copy of it.
// A row looks like: | `T-framing` | The idea. | S1 |
export function parseThreads(markdown: string) {
  return [...markdown.matchAll(/^\| `(T-[a-z-]+)` \| (.+?) \| S(\d+) \|$/gm)].map(([, id, idea, first]) => ({
    id,
    idea,
    firstSeen: Number(first),
  }));
}

const threads = defineCollection({
  loader: file('../docs/curriculum/README.md', { parser: parseThreads }),
  schema: z.object({ id: threadId, idea: z.string(), firstSeen: z.number().int().min(1) }),
});

export const collections = { sessions, modules, quiz, cards, assessments, threads };
