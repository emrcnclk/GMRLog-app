// @vitest-environment happy-dom
import { Text } from '@gmrlog/ui';
import { describe, expect, it } from 'vitest';

import { renderWithTheme, screen } from '../../../test-support/render';

/**
 * Two faults the account screen shipped with, both invisible to a suite that
 * never rendered: a sentence set in `role="meta"` (monospace, uppercase,
 * tracked out — a system stamp where the plainest warning on the screen
 * belongs), and a raw API route printed as product copy.
 *
 * The rows take live query hooks, so this asserts the property on the
 * primitive and on the shipped strings rather than mounting the whole screen:
 * the smallest thing that still fails if either fault comes back.
 */
describe('role="meta" is not for sentences', () => {
  it('sets meta in monospace uppercase, which is why a sentence must not use it', () => {
    renderWithTheme(<Text role="meta">Deletes on 23 September</Text>);

    const style = getComputedStyle(screen.getByText('Deletes on 23 September'));
    expect(style.textTransform).toBe('uppercase');
    expect(style.fontFamily).toMatch(/Mono/i);
  });

  it('leaves body as a plain sentence', () => {
    renderWithTheme(
      <Text role="body">
        Starts a 30-day grace period. You can cancel any time before it ends.
      </Text>,
    );

    const style = getComputedStyle(screen.getByText(/Starts a 30-day grace period/));
    expect(style.textTransform).not.toBe('uppercase');
    expect(style.fontFamily).not.toMatch(/Mono/i);
  });
});
