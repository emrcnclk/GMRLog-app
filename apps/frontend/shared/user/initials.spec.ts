import { describe, expect, it } from 'vitest';

import { userInitials } from './initials';

describe('userInitials', () => {
  it('takes first and last initials from a multi-word name', () => {
    expect(userInitials('Ada Lovelace')).toBe('AL');
    expect(userInitials('Jean Luc Picard')).toBe('JP');
  });

  it('takes two characters from a single-word handle', () => {
    expect(userInitials('gmrlog')).toBe('GM');
  });

  it('falls back to a question mark for empty input', () => {
    expect(userInitials('')).toBe('?');
    expect(userInitials('   ')).toBe('?');
    expect(userInitials(null)).toBe('?');
    expect(userInitials(undefined)).toBe('?');
  });

  it('tolerates irregular whitespace', () => {
    expect(userInitials('  Ada   Lovelace  ')).toBe('AL');
  });

  it('handles a single character name', () => {
    expect(userInitials('x')).toBe('X');
  });

  it('does not split surrogate pairs', () => {
    // Emoji display names are legal. Slicing by raw string index would cut a
    // code point in half and render as a replacement character.
    expect(userInitials('🎮 Player')).toBe('🎮P');
    expect(userInitials('🎮🕹')).toBe('🎮🕹');
  });
});
