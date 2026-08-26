import { describe, expect, it } from 'vitest';

import { BIRTH_DATE_MAX_LENGTH, formatBirthDateInput } from './birth-date-input';

describe('formatBirthDateInput', () => {
  it('inserts the separators as the digits arrive', () => {
    expect(formatBirthDateInput('1')).toBe('1');
    expect(formatBirthDateInput('1995')).toBe('1995');
    expect(formatBirthDateInput('19950')).toBe('1995-0');
    expect(formatBirthDateInput('199506')).toBe('1995-06');
    expect(formatBirthDateInput('1995061')).toBe('1995-06-1');
    expect(formatBirthDateInput('19950615')).toBe('1995-06-15');
  });

  // The whole point of the change: a numeric keypad has no hyphen, so the
  // player never types one and the field must still complete.
  it('needs no separator from the player', () => {
    expect(formatBirthDateInput('19950615')).toBe('1995-06-15');
  });

  it('is idempotent, so re-formatting its own output changes nothing', () => {
    expect(formatBirthDateInput('1995-06-15')).toBe('1995-06-15');
    expect(formatBirthDateInput('1995-06')).toBe('1995-06');
  });

  // A field that puts a character back the instant it is deleted cannot be
  // edited backwards. Deleting the `6` of `1995-06` must leave `1995-0`, and
  // deleting that must leave `1995`, not `1995-`.
  it('never appends a trailing separator', () => {
    expect(formatBirthDateInput('1995-0')).toBe('1995-0');
    expect(formatBirthDateInput('1995-')).toBe('1995');
    expect(formatBirthDateInput('1995-06-')).toBe('1995-06');
  });

  it('drops anything that is not a digit, including a pasted date', () => {
    expect(formatBirthDateInput('15/06/1995')).toBe('1506-19-95');
    expect(formatBirthDateInput('abc')).toBe('');
    expect(formatBirthDateInput('1995 06 15')).toBe('1995-06-15');
  });

  it('stops at eight digits, so the field cannot overrun the format', () => {
    expect(formatBirthDateInput('199506150000')).toBe('1995-06-15');
    expect(formatBirthDateInput('19950615').length).toBe(BIRTH_DATE_MAX_LENGTH);
  });
});
