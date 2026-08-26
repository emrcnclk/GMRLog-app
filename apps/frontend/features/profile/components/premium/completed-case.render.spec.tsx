// @vitest-environment happy-dom
import type { LibraryEntryResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { renderWithTheme, screen } from '../../../../test-support/render';

import { CompletedCase } from './completed-case';

/**
 * §6's Platinum case, which for most of this project could not exist: no
 * per-entry completion figure was in the schema, so the section was built from
 * the `completed` shelf and the `100%` label the doc asks for was dropped
 * rather than faked. 13.1 gave it a real field, and this pins the two things
 * that decides — which name the section takes, and whether the label is drawn
 * on a cover that has not earned it.
 *
 * A pure selector test covers the picking. It cannot see the label, the
 * section title, or the accessible name a screen reader reads out, which is
 * exactly the category of defect the render harness exists for.
 */
function entry(
  gameId: string,
  status: LibraryEntryResponse['status'],
  completionPercent: number | null,
): LibraryEntryResponse {
  return {
    gameId,
    game: { id: gameId, title: `Game ${gameId}`, slug: gameId, coverUrl: null },
    status,
    source: 'manual',
    updatedAt: '2026-06-01T00:00:00.000Z',
    completionPercent,
    completionSource: completionPercent === null ? null : 'self_reported',
  };
}

const noop = () => {
  /* the case is rendered, never pressed, in these assertions */
};

describe('CompletedCase', () => {
  it('names itself Platinum and labels the cover once an entry claims a hundred', () => {
    renderWithTheme(<CompletedCase entries={[entry('a', 'completed', 100)]} onPressGame={noop} />);

    expect(screen.getByText('Platinum')).toBeTruthy();
    expect(screen.getByText(/100%/)).toBeTruthy();
  });

  // The fallback is not a leftover: a player who has never entered a figure
  // still has finished games, and showing them an empty Platinum shelf would
  // trade content for a label.
  it('stays the Completed case, unlabelled, for a player who has entered nothing', () => {
    renderWithTheme(<CompletedCase entries={[entry('a', 'completed', null)]} onPressGame={noop} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText('Platinum')).toBeNull();
    expect(screen.queryByText(/100%/)).toBeNull();
  });

  // The completed shelf means "finished it", never "finished it completely".
  it('does not label a completed entry that claims 99', () => {
    renderWithTheme(<CompletedCase entries={[entry('a', 'completed', 99)]} onPressGame={noop} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText(/100%/)).toBeNull();
  });

  it('tells a screen reader which of the two it is opening', () => {
    renderWithTheme(<CompletedCase entries={[entry('a', 'completed', 100)]} onPressGame={noop} />);

    const label = screen.getByRole('button').getAttribute('aria-label') ?? '';
    expect(label).toContain('100% complete');
  });

  // CLAUDE.md's rule, asserted rather than assumed: counts and dates are
  // monospace `meta`, and the label sits with them.
  it('draws the figure as metadata, not as prose', () => {
    renderWithTheme(<CompletedCase entries={[entry('a', 'completed', 100)]} onPressGame={noop} />);

    const style = getComputedStyle(screen.getByText(/100%/));
    expect(style.textTransform).toBe('uppercase');
  });

  it('renders nothing at all rather than an empty shelf', () => {
    const { container } = renderWithTheme(<CompletedCase entries={[]} onPressGame={noop} />);

    expect(container.textContent).toBe('');
  });
});
