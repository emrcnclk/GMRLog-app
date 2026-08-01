import { describe, expect, it } from 'vitest';

import { RSVP_STATES, rsvpStateLabel, viewerRsvpState } from './event-model';

describe('event rsvp model', () => {
  it('lists D3.24 LFG RSVP states', () => {
    expect(RSVP_STATES).toEqual([
      'looking_for_team',
      'need_players',
      'hosting',
      'going',
      'interested',
    ]);
    expect(rsvpStateLabel('looking_for_team')).toBe('looking for team');
  });

  it('reads viewer participation state', () => {
    expect(
      viewerRsvpState({
        id: 'e1',
        title: 'Raid',
        kind: 'game',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: null,
        viewerParticipation: { state: 'hosting', createdAt: '2026-01-01T00:00:00.000Z' },
      }),
    ).toBe('hosting');
  });
});
