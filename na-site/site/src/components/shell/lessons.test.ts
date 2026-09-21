import { describe, expect, it } from 'vitest';
import { parseCurriculum, plannedTitle, sessionLessons, threadTitle } from './lessons';

describe('parseCurriculum', () => {
  it('reads the title line in the layout of each session file', () => {
    const markdown = [
      '### s01-m01-seven-syscalls',
      '',
      '- **Title:** Seven system calls: the whole of a TCP server.',
      '- **Minutes:** 20.',
      '### Not a module',
      '### s05-m01-http10',
      '- **Title:** HTTP/1.0: one question, then the line goes dead. **Minutes:** 20.',
      '### s01-m08-framing',
      '- **Title:** Framing: where does a message end?',
      '### s02-m09-ftp-framing',
      '- **Minutes:** 20.',
    ].join('\n');
    expect(parseCurriculum(markdown)).toEqual([
      { id: 's01-m01-seven-syscalls', title: 'Seven system calls: the whole of a TCP server' },
      { id: 's05-m01-http10', title: 'HTTP/1.0: one question, then the line goes dead' },
      { id: 's01-m08-framing', title: 'Framing: where does a message end?' },
      { id: 's02-m09-ftp-framing', title: 'Ftp framing' },
    ]);
  });

  it('finds the title of a real planned lesson', () => {
    expect(plannedTitle('s01-m11-tlv-asn1')).toBe('TLV and ASN.1: messages that describe themselves');
  });
});

describe('sessionLessons', () => {
  it('keeps the curriculum order, takes the page title, and adds a page with no heading at the end', () => {
    const planned = [
      { id: 's01-m01-a', title: 'Planned A' },
      { id: 's01-m02-b', title: 'Planned B' },
    ];
    const pages = [
      { id: 's01-m09-x', title: 'Page X' },
      { id: 's01-m02-b', title: 'Page B' },
    ];
    expect(sessionLessons(planned, pages)).toEqual([
      { id: 's01-m01-a', title: 'Planned A', hasPage: false },
      { id: 's01-m02-b', title: 'Page B', hasPage: true },
      { id: 's01-m09-x', title: 'Page X', hasPage: true },
    ]);
  });

  it('puts the digest of the session first, because the curriculum file plans no digest', () => {
    const planned = [{ id: 's01-m01-a', title: 'Planned A' }];
    const pages = [
      { id: 's01-m01-a', title: 'Page A' },
      { id: 's01-digest', title: 'Class 1 in one fast read', kind: 'digest' as const },
    ];
    expect(sessionLessons(planned, pages).map((lesson) => lesson.id)).toEqual(['s01-digest', 's01-m01-a']);
  });
});

describe('threadTitle', () => {
  it('gives a name with no prefix and no hyphens', () => {
    expect(threadTitle('T-skip-unknown')).toBe('Skip unknown');
  });
});
