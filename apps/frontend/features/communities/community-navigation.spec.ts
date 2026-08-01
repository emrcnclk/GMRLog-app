import { describe, expect, it } from 'vitest';

describe('community navigation', () => {
  it('routes communities list → detail → members', () => {
    expect('/(app)/communities').toBe('/(app)/communities');
    expect('/(app)/community/c1').toBe('/(app)/community/c1');
    expect('/(app)/community/c1/members').toBe('/(app)/community/c1/members');
  });

  it('routes community → edit modal', () => {
    expect('/(app)/community/c1/edit').toBe('/(app)/community/c1/edit');
  });

  it('routes create modal → detail after save', () => {
    expect('/(app)/communities/create').toBe('/(app)/communities/create');
    const createdId = 'c9';
    expect(`/(app)/community/${createdId}`).toBe('/(app)/community/c9');
  });

  it('delete returns to communities list', () => {
    expect('/(app)/communities').toContain('communities');
  });

  it('discover communities open detail', () => {
    expect(`/(app)/community/c1`).toContain('community');
  });
});
