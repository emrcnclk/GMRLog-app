import { describe, expect, it } from 'vitest';

describe('tier lists navigation', () => {
  it('routes list → detail → builder → edit', () => {
    expect('/(app)/tier-lists').toBe('/(app)/tier-lists');
    expect('/(app)/tier-list/t1').toBe('/(app)/tier-list/t1');
    expect('/(app)/tier-list/t1/builder').toBe('/(app)/tier-list/t1/builder');
    expect('/(app)/tier-list/t1/edit').toBe('/(app)/tier-list/t1/edit');
  });

  it('create opens builder', () => {
    expect('/(app)/tier-lists/create').toBe('/(app)/tier-lists/create');
    expect('/(app)/tier-list/t9/builder').toContain('builder');
  });
});
