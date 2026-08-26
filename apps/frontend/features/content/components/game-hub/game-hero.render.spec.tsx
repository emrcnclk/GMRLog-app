// @vitest-environment happy-dom
import type { GameResponse, LibraryStatusValue } from '@gmrlog/types';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderWithTheme, screen } from '../../../../test-support/render';

import { GameHero } from './game-hero';

/**
 * §5's action row, which the doc has always described as a primary button and
 * "two 44px square icon buttons beside it" and which shipped with one. 13.1
 * adds the second, and it is conditional: a completion figure has to attach to
 * a library entry, so a game the viewer has never logged has nothing to attach
 * to and the button is not offered.
 *
 * That condition is the reason this is a render spec. It is not a formatting
 * rule a pure function can hold — it is whether a control exists on screen,
 * and what a screen reader is told it does.
 *
 * Icons in the tree are also why this spec could not have been written before
 * this session: every lucide glyph goes through `react-native-svg`, which took
 * the whole render down until the harness stubbed it.
 */
function game(library: GameResponse['library']): GameResponse {
  return {
    id: 'g1',
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    coverUrl: null,
    coverImage: null,
    platforms: [],
    library,
    stats: { ratingAverage: 4.5, ratingCount: 12, libraryCount: 30 },
    heroUrl: null,
    heroImage: null,
    summary: null,
    description: null,
    trailerUrl: null,
    externalRating: null,
    externalRatingCount: null,
    releaseDate: '2017-02-24',
    genres: [],
    tags: [],
    developers: [],
    publishers: [],
    franchise: null,
    series: null,
    screenshots: [],
    metadata: { status: 'complete', provider: 'igdb', refreshedAt: null, attribution: null },
  };
}

function shelved(status: LibraryStatusValue, completionPercent: number | null) {
  return game({
    status,
    source: 'manual',
    ownershipIndicator: 'manual',
    completionPercent,
    completionSource: completionPercent === null ? null : 'self_reported',
  });
}

const props = { media: [], hub: null, isPending: false };
const noop = () => undefined;

describe('GameHero', () => {
  it('offers the completion editor on a game the viewer has logged', () => {
    renderWithTheme(
      <GameHero
        {...props}
        game={shelved('playing', null)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={noop}
      />,
    );

    expect(screen.getByLabelText('Set how far you got')).toBeTruthy();
  });

  it('does not offer it on a game with no entry to attach a figure to', () => {
    renderWithTheme(
      <GameHero
        {...props}
        game={game(null)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={noop}
      />,
    );

    expect(screen.queryByLabelText('Set how far you got')).toBeNull();
  });

  it('tells a screen reader the figure it is about to change', () => {
    renderWithTheme(
      <GameHero
        {...props}
        game={shelved('completed', 62)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={noop}
      />,
    );

    expect(screen.getByLabelText('Change how far you got, currently 62% complete')).toBeTruthy();
  });

  it('names a full hundred rather than measuring it', () => {
    renderWithTheme(
      <GameHero
        {...props}
        game={shelved('completed', 100)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={noop}
      />,
    );

    expect(screen.getByText('Platinum')).toBeTruthy();
  });

  // Zero is an answer and null is silence — the distinction the nullable
  // column exists to keep, asserted where a player would actually see it.
  it('draws a claim of zero and draws nothing for silence', () => {
    const { unmount } = renderWithTheme(
      <GameHero
        {...props}
        game={shelved('playing', 0)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={noop}
      />,
    );
    expect(screen.getByText('0% complete')).toBeTruthy();
    unmount();

    renderWithTheme(
      <GameHero
        {...props}
        game={shelved('playing', null)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={noop}
      />,
    );
    expect(screen.queryByText(/complete/)).toBeNull();
  });

  it('opens the editor when the button is pressed', () => {
    const onSetCompletion = vi.fn();
    renderWithTheme(
      <GameHero
        {...props}
        game={shelved('playing', null)}
        onWriteReview={noop}
        onWritePost={noop}
        onSetCompletion={onSetCompletion}
      />,
    );

    fireEvent.click(screen.getByLabelText('Set how far you got'));

    expect(onSetCompletion).toHaveBeenCalledOnce();
  });
});
