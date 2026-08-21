import { Fragment, memo } from 'react';
import { View } from 'react-native';

import { Text } from '../components/text';
import { useTheme } from '../theme/theme-provider';
import type { SemanticTypeRole } from '../theme/tokens';

import {
  parseMarkdown,
  spansToText,
  type MarkdownBlock,
  type MarkdownSpan,
} from './parse-markdown';

export interface MarkdownProps {
  /** Markdown source. Parsed on every render; documents are small and static. */
  source: string;
}

const HEADING_ROLE: Record<1 | 2 | 3, SemanticTypeRole> = {
  1: 'title1',
  2: 'title2',
  3: 'title3',
};

function Spans({ spans }: { spans: MarkdownSpan[] }) {
  return (
    <>
      {spans.map((span, index) => (
        <Text
          // Spans are positional within an immutable parsed block; there is no
          // stable id to key on and the list never reorders.
          key={`${String(index)}:${span.text.slice(0, 12)}`}
          // Weight 500 is the ceiling the design law allows — strong is a step
          // in weight, never a jump to bold.
          style={span.strong ? { fontWeight: '500' } : undefined}
        >
          {span.text}
        </Text>
      ))}
    </>
  );
}

function Block({ block }: { block: MarkdownBlock }) {
  const theme = useTheme();

  if (block.kind === 'heading') {
    return (
      <Text role={HEADING_ROLE[block.level]} color="color.text.primary">
        <Spans spans={block.spans} />
      </Text>
    );
  }

  if (block.kind === 'paragraph') {
    return (
      <Text role="body" color="color.text.secondary">
        <Spans spans={block.spans} />
      </Text>
    );
  }

  if (block.kind === 'list') {
    return (
      <View style={{ gap: theme.space('space.2') }}>
        {block.items.map((item, index) => (
          <View
            key={`${String(index)}:${spansToText(item).slice(0, 16)}`}
            style={{ flexDirection: 'row', gap: theme.space('space.2') }}
          >
            {/* Decorative: the bullet is layout, and a screen reader reading
                "dash" before every item is noise. */}
            <Text role="body" color="color.text.tertiary" aria-hidden accessible={false}>
              —
            </Text>
            <Text role="body" color="color.text.secondary" style={{ flex: 1 }}>
              <Spans spans={item} />
            </Text>
          </View>
        ))}
      </View>
    );
  }

  // Table. Stacked rather than columnar: these are two- and three-column
  // tables of sentences, and a real grid at 375 would either clip or force a
  // horizontal scroll. Each row becomes a labelled block, which reads the same
  // at every width and needs no scroll container.
  return (
    <View style={{ gap: theme.space('space.4') }}>
      {block.rows.map((row, rowIndex) => (
        <View
          key={`row-${String(rowIndex)}`}
          style={{
            gap: theme.space('space.2'),
            paddingLeft: theme.space('space.4'),
            borderLeftWidth: 1,
            borderLeftColor: theme.color('color.border.default'),
          }}
        >
          {row.map((cell, cellIndex) => {
            const header = block.headers[cellIndex];

            // The first column is the row's subject; the rest are its
            // attributes, each named by its own column header.
            if (cellIndex === 0) {
              return (
                <Text key={`cell-${String(cellIndex)}`} role="body" color="color.text.primary">
                  <Spans spans={cell} />
                </Text>
              );
            }

            return (
              <View key={`cell-${String(cellIndex)}`} style={{ gap: theme.space('space.1') }}>
                {header === undefined ? null : (
                  <Text role="label" color="color.text.tertiary">
                    {spansToText(header)}
                  </Text>
                )}
                <Text role="bodySm" color="color.text.secondary">
                  <Spans spans={cell} />
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * 12.3 — renders the Markdown subset `parse-markdown` supports, entirely
 * through theme tokens.
 *
 * Every value here resolves through `useTheme()`; there is no stylesheet of
 * raw sizes and colours, which is the reason this exists instead of a
 * third-party renderer. Sentences stay in `body`/`bodySm` — the monospace
 * `meta` roles are reserved for metadata, and a legal sentence is a sentence.
 */
function MarkdownComponent({ source }: MarkdownProps) {
  const theme = useTheme();
  const blocks = parseMarkdown(source);

  return (
    <View style={{ gap: theme.space('space.4') }}>
      {blocks.map((block, index) => (
        <Fragment key={`block-${String(index)}`}>
          <Block block={block} />
        </Fragment>
      ))}
    </View>
  );
}

export const Markdown = memo(MarkdownComponent);
