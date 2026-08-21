/**
 * 12.3 — a deliberately small Markdown subset, parsed into blocks.
 *
 * **Why a parser here rather than a library.** The legal documents (12.1) are
 * server-authored Markdown, and nothing in `@gmrlog/ui` renders block-level
 * content. The alternative was a third-party Markdown renderer, which cannot
 * resolve its colours and sizes through `useTheme()` — every such library
 * styles by stylesheet object, which is exactly the raw-value inlining the
 * design law forbids — and would add a fourth React Native peer dependency to
 * a stack that already warns on three at boot. So: the subset the documents
 * actually use, and nothing else.
 *
 * **Supported, because 12.1's six documents use exactly this:** `#`/`##`/`###`
 * headings, blank-line-separated paragraphs with soft wrapping, `-` bullet
 * lists, `**strong**` inline, and pipe tables.
 *
 * **Unsupported on purpose:** images, links, code, blockquotes, ordered lists,
 * nested lists, `*italic*`, HTML. An unsupported construct degrades to its
 * literal text rather than throwing — a legal document must render something
 * readable even if it grows a construct this parser has not met.
 */

/** An inline run of text. `strong` is the only mark the subset carries. */
export interface MarkdownSpan {
  text: string;
  strong: boolean;
}

export type MarkdownBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; spans: MarkdownSpan[] }
  | { kind: 'paragraph'; spans: MarkdownSpan[] }
  | { kind: 'list'; items: MarkdownSpan[][] }
  | { kind: 'table'; headers: MarkdownSpan[][]; rows: MarkdownSpan[][][] };

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;
const LIST_ITEM_PATTERN = /^[-*]\s+(.*)$/;
const TABLE_DIVIDER_PATTERN = /^\|(?:\s*:?-{2,}:?\s*\|)+$/;

/**
 * Splits on `**`, alternating plain and strong. An unmatched `**` leaves its
 * text literal rather than swallowing the rest of the line.
 */
export function parseInline(text: string): MarkdownSpan[] {
  const spans: MarkdownSpan[] = [];
  let rest = text;

  while (rest.length > 0) {
    const open = rest.indexOf('**');

    if (open === -1) {
      spans.push({ text: rest, strong: false });
      break;
    }

    const close = rest.indexOf('**', open + 2);

    if (close === -1) {
      // Unterminated — keep the marker as literal text.
      spans.push({ text: rest, strong: false });
      break;
    }

    if (open > 0) {
      spans.push({ text: rest.slice(0, open), strong: false });
    }

    const strongText = rest.slice(open + 2, close);
    if (strongText.length > 0) {
      spans.push({ text: strongText, strong: true });
    }

    rest = rest.slice(close + 2);
  }

  return spans.filter((span) => span.text.length > 0);
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableRow(line: string): boolean {
  return line.startsWith('|') && line.endsWith('|') && line.length > 2;
}

/** Joins soft-wrapped lines into one logical line, the way Markdown does. */
function joinSoftWrap(lines: string[]): string {
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];

  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    const heading = HEADING_PATTERN.exec(trimmed);
    if (heading) {
      const hashes = heading[1] ?? '#';
      const content = heading[2] ?? '';
      blocks.push({
        kind: 'heading',
        level: hashes.length as 1 | 2 | 3,
        spans: parseInline(content.trim()),
      });
      index += 1;
      continue;
    }

    // Table: a header row, a divider row, then zero or more body rows.
    if (isTableRow(trimmed) && TABLE_DIVIDER_PATTERN.test((lines[index + 1] ?? '').trim())) {
      const headers = splitTableRow(trimmed).map(parseInline);
      const rows: MarkdownSpan[][][] = [];
      index += 2;

      while (index < lines.length && isTableRow((lines[index] ?? '').trim())) {
        rows.push(splitTableRow((lines[index] ?? '').trim()).map(parseInline));
        index += 1;
      }

      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    if (LIST_ITEM_PATTERN.test(trimmed)) {
      const items: MarkdownSpan[][] = [];
      let current: string[] = [];

      while (index < lines.length) {
        const itemLine = lines[index] ?? '';
        const itemTrimmed = itemLine.trim();

        if (itemTrimmed.length === 0) {
          break;
        }

        const match = LIST_ITEM_PATTERN.exec(itemTrimmed);

        if (match) {
          if (current.length > 0) {
            items.push(parseInline(joinSoftWrap(current)));
          }
          current = [match[1] ?? ''];
        } else if (current.length > 0) {
          // Indented continuation of the item above.
          current.push(itemTrimmed);
        } else {
          break;
        }

        index += 1;
      }

      if (current.length > 0) {
        items.push(parseInline(joinSoftWrap(current)));
      }

      blocks.push({ kind: 'list', items });
      continue;
    }

    // Paragraph — consume until a blank line or a line that starts another block.
    //
    // The first line is consumed unconditionally, and that is load-bearing
    // rather than incidental: control only reaches here after the heading,
    // table and list checks have already rejected this line, so it *is*
    // paragraph text whatever it looks like. Breaking on the same constructs
    // before consuming anything would leave `index` unmoved and spin forever —
    // which is exactly what a pipe row with no divider row under it did
    // (`| not | a | table |` is `isTableRow`, but not a table), found by the
    // spec beside this file rather than by a reader hitting a frozen screen.
    const paragraph: string[] = [];

    while (index < lines.length) {
      const paragraphLine = lines[index] ?? '';
      const paragraphTrimmed = paragraphLine.trim();

      if (paragraphTrimmed.length === 0) {
        break;
      }

      if (
        paragraph.length > 0 &&
        (HEADING_PATTERN.test(paragraphTrimmed) ||
          LIST_ITEM_PATTERN.test(paragraphTrimmed) ||
          isTableRow(paragraphTrimmed))
      ) {
        break;
      }

      paragraph.push(paragraphTrimmed);
      index += 1;
    }

    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', spans: parseInline(joinSoftWrap(paragraph)) });
    }
  }

  return blocks;
}

/** Plain text of a block, for accessibility labels and tests. */
export function spansToText(spans: MarkdownSpan[]): string {
  return spans.map((span) => span.text).join('');
}
