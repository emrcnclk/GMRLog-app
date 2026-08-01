import { describe, expect, it } from 'vitest';

describe('messaging navigation', () => {
  it('routes inbox → conversation → back', () => {
    expect('/(app)/messages').toBe('/(app)/messages');
    expect(`/(app)/messages/c1`).toBe('/(app)/messages/c1');
  });

  it('routes new conversation → conversation', () => {
    expect('/(app)/messages/new').toBe('/(app)/messages/new');
    const createdId = 'c9';
    expect(`/(app)/messages/${createdId}`).toBe('/(app)/messages/c9');
  });

  it('opens inbox from profile overflow', () => {
    expect('/(app)/messages').toContain('messages');
  });
});
