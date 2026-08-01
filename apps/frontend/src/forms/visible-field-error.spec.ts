import { describe, expect, it } from 'vitest';

import { visibleFieldError } from './visible-field-error';

const error = { type: 'invalid_string', message: 'Enter a valid email address' } as const;

describe('visibleFieldError', () => {
  it('stays silent while the field is still untouched', () => {
    expect(visibleFieldError(error, undefined, false)).toBeUndefined();
  });

  it('surfaces copy after blur', () => {
    expect(visibleFieldError(error, true, false)).toBe(error.message);
  });

  it('surfaces copy after submit even when untouched', () => {
    expect(visibleFieldError(error, undefined, true)).toBe(error.message);
  });

  it('returns nothing without an error', () => {
    expect(visibleFieldError(undefined, true, true)).toBeUndefined();
  });
});
