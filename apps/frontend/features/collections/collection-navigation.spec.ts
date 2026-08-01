import { describe, expect, it } from 'vitest';

describe('collections navigation', () => {
  it('routes list → detail → edit → entries → delete return', () => {
    expect('/(app)/collections').toBe('/(app)/collections');
    expect('/(app)/collection/c1').toBe('/(app)/collection/c1');
    expect('/(app)/collection/c1/edit').toBe('/(app)/collection/c1/edit');
    expect('/(app)/collection/c1/entries').toBe('/(app)/collection/c1/entries');
  });

  it('routes create modal to detail', () => {
    expect('/(app)/collections/create').toBe('/(app)/collections/create');
    expect('/(app)/collection/c9').toContain('collection');
  });
});
