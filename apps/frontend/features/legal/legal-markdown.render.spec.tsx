// @vitest-environment happy-dom
import { Markdown } from '@gmrlog/ui';
import { describe, expect, it } from 'vitest';

import { renderWithTheme, screen } from '../../test-support/render';

/**
 * `Markdown` is a `@gmrlog/ui` primitive, tested from here because that
 * package has no DOM environment and a spec importing a component there
 * cannot parse at all — see `vitest.config.ts` for what the frontend had to
 * unblock to render anything.
 *
 * This pins the defect that left the legal reader structureless: every
 * heading rendered at body size, byte-for-byte identical to the paragraph
 * beneath it. 827 pure-logic tests were green over it, because none of them
 * rendered.
 */
const SOURCE = [
  '# Terms of Service',
  '',
  '## 1. What this is',
  '',
  'These terms are the agreement.',
].join('\n');

/** The innermost element carrying exactly this text — RNW nests spans. */
function leafWithText(text: string): HTMLElement {
  const matches = screen.getAllByText(text);
  return matches[matches.length - 1] as HTMLElement;
}

const sizeOf = (el: Element): number => Number.parseFloat(getComputedStyle(el).fontSize);

describe('Markdown block roles', () => {
  it('renders a heading larger than the paragraph under it', () => {
    renderWithTheme(<Markdown source={SOURCE} />);

    expect(sizeOf(leafWithText('1. What this is'))).toBeGreaterThan(
      sizeOf(leafWithText('These terms are the agreement.')),
    );
  });

  it('gives each heading level its own size', () => {
    renderWithTheme(<Markdown source={SOURCE} />);

    expect(sizeOf(leafWithText('Terms of Service'))).toBeGreaterThan(
      sizeOf(leafWithText('1. What this is')),
    );
  });

  it('does not let an inline span flatten the block that contains it', () => {
    // The bug's actual mechanism: `Spans` wrapped every run in a bare
    // `<Text>`, which defaults to `role="body"` and writes an explicit
    // fontSize, so the child stamped body over its own heading. A strong run
    // may step up in weight; it must not change size.
    const { container } = renderWithTheme(<Markdown source={'## Alpha **Beta**'} />);

    const runs = Array.from(container.querySelectorAll('span')).filter(
      (el) => el.textContent === 'Alpha ' || el.textContent === 'Beta',
    );

    expect(runs.length).toBeGreaterThanOrEqual(2);
    expect(new Set(runs.map(sizeOf)).size).toBe(1);
  });
});
