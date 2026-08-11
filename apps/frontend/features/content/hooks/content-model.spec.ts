import { describe, expect, it } from 'vitest';

import {
  buildPollOptions,
  postComposerFormSchema,
  ratingForStar,
  starsForRating,
} from './content-model';

describe('post composer poll helpers', () => {
  it('collects trimmed poll options', () => {
    const values = postComposerFormSchema.parse({
      body: 'Vote now',
      visibility: 'public',
      gameId: '',
      includePoll: true,
      pollQuestion: 'Best boss?',
      pollOptionA: ' A ',
      pollOptionB: 'B',
      pollOptionC: '',
      pollOptionD: '  ',
    });
    expect(buildPollOptions(values)).toEqual(['A', 'B']);
  });
});

describe('review star rating mapping', () => {
  it('maps each of the five stars to an even point on the 1–10 scale', () => {
    expect([1, 2, 3, 4, 5].map(ratingForStar)).toEqual([2, 4, 6, 8, 10]);
  });

  it('shows no stars lit until a rating is set', () => {
    expect(starsForRating(null)).toBe(0);
  });

  it('rounds an odd rating up to a whole star', () => {
    expect(starsForRating(7)).toBe(4);
  });

  it('lights all five stars at the top of the scale', () => {
    expect(starsForRating(10)).toBe(5);
  });
});
