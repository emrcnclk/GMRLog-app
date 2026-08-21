import { describe, expect, it } from 'vitest';

import { parseInline, parseMarkdown, spansToText, type MarkdownBlock } from './parse-markdown';

function textOf(block: MarkdownBlock | undefined): string {
  if (block === undefined) {
    return '';
  }
  if (block.kind === 'heading' || block.kind === 'paragraph') {
    return spansToText(block.spans);
  }
  if (block.kind === 'list') {
    return block.items.map(spansToText).join(' | ');
  }
  return block.rows.map((row) => row.map(spansToText).join(' | ')).join(' // ');
}

describe('parseInline', () => {
  it('splits strong runs out of plain text', () => {
    expect(parseInline('plain **strong** tail')).toEqual([
      { text: 'plain ', strong: false },
      { text: 'strong', strong: true },
      { text: ' tail', strong: false },
    ]);
  });

  it('handles a line that is entirely strong', () => {
    expect(parseInline('**all of it**')).toEqual([{ text: 'all of it', strong: true }]);
  });

  it('leaves an unterminated marker literal rather than swallowing the line', () => {
    // A legal document must render something readable even when its Markdown
    // is malformed; eating the rest of a clause would be the worst outcome.
    expect(parseInline('we **never sell your data')).toEqual([
      { text: 'we **never sell your data', strong: false },
    ]);
  });

  it('drops empty runs', () => {
    expect(parseInline('****')).toEqual([]);
  });
});

describe('parseMarkdown headings', () => {
  it('reads the three supported levels', () => {
    const blocks = parseMarkdown('# One\n\n## Two\n\n### Three');
    expect(blocks.map((block) => (block.kind === 'heading' ? block.level : null))).toEqual([
      1, 2, 3,
    ]);
  });

  it('does not treat a fourth level as a heading', () => {
    const [block] = parseMarkdown('#### Four');
    expect(block?.kind).toBe('paragraph');
    expect(textOf(block)).toBe('#### Four');
  });
});

describe('parseMarkdown paragraphs', () => {
  it('joins soft-wrapped lines into one paragraph', () => {
    const [block] = parseMarkdown('This sentence is\nwrapped across\nthree lines.');
    expect(block?.kind).toBe('paragraph');
    expect(textOf(block)).toBe('This sentence is wrapped across three lines.');
  });

  it('separates paragraphs on a blank line', () => {
    const blocks = parseMarkdown('First.\n\nSecond.');
    expect(blocks).toHaveLength(2);
    expect(textOf(blocks[1])).toBe('Second.');
  });

  it('ends a paragraph when a heading starts, even without a blank line', () => {
    const blocks = parseMarkdown('Sentence.\n# Heading');
    expect(blocks.map((block) => block.kind)).toEqual(['paragraph', 'heading']);
  });
});

describe('parseMarkdown lists', () => {
  it('collects consecutive items into one list', () => {
    const [block] = parseMarkdown('- one\n- two\n- three');
    expect(block?.kind).toBe('list');
    expect(textOf(block)).toBe('one | two | three');
  });

  it('folds an indented continuation into the item above', () => {
    // 12.1's documents wrap long bullets across lines; a continuation must not
    // become its own bullet.
    const [block] = parseMarkdown('- we do not run advertising, and there is no\n  identifier');
    expect(textOf(block)).toBe('we do not run advertising, and there is no identifier');
  });

  it('keeps strong marks inside an item', () => {
    const [block] = parseMarkdown('- **Your account:** for as long as it exists.');
    expect(block?.kind === 'list' && block.items[0]?.[0]).toEqual({
      text: 'Your account:',
      strong: true,
    });
  });
});

describe('parseMarkdown tables', () => {
  const table = [
    '| What we do | GDPR basis | KVKK basis |',
    '|---|---|---|',
    '| Operate your account | Contract | Contract |',
    '| Moderate content | Legitimate interests | Legitimate interests |',
  ].join('\n');

  it('reads headers and rows', () => {
    const [block] = parseMarkdown(table);
    expect(block?.kind).toBe('table');
    expect(block?.kind === 'table' && block.headers.map(spansToText)).toEqual([
      'What we do',
      'GDPR basis',
      'KVKK basis',
    ]);
    expect(block?.kind === 'table' && block.rows).toHaveLength(2);
  });

  it('needs a divider row — pipes alone are not a table', () => {
    const [block] = parseMarkdown('| not | a | table |');
    expect(block?.kind).toBe('paragraph');
  });

  it('stops at the first non-row line', () => {
    const blocks = parseMarkdown(`${table}\n\nAfter the table.`);
    expect(blocks.map((block) => block.kind)).toEqual(['table', 'paragraph']);
  });
});

describe('parseMarkdown resilience', () => {
  it('returns nothing for empty or blank source', () => {
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('\n\n   \n')).toEqual([]);
  });

  it('degrades an unsupported construct to its literal text instead of throwing', () => {
    // Blockquotes, code fences and images are out of the subset on purpose.
    const blocks = parseMarkdown('> quoted\n\n```code```\n\n![alt](img.png)');
    expect(blocks.every((block) => block.kind === 'paragraph')).toBe(true);
  });

  it('normalises CRLF', () => {
    const blocks = parseMarkdown('# Title\r\n\r\nBody.');
    expect(blocks.map((block) => block.kind)).toEqual(['heading', 'paragraph']);
  });
});
