import { describe, expect, it } from 'vitest';

import { buildPollOptions, postComposerFormSchema } from './content-model';

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
