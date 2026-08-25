/**
 * Digits-only date entry that inserts its own separators.
 *
 * The field asked for `keyboardType="numbers-and-punctuation"`, an iOS-only RN
 * value. Android native does not honour it, and RNW's `TextInput` has no case
 * for it either — its switch falls to `default: type = 'text'` and writes no
 * `inputmode` at all, so mobile web offered a full alphabetic keyboard for a
 * `YYYY-MM-DD` field. The one-word fix CLAUDE.md warned about (`inputMode`
 * `"numeric"` on its own) trades that for a different defect: a numeric keypad
 * puts the hyphen out of reach, and the player cannot complete the field at all.
 *
 * So the separators stop being the player's problem. The field takes digits,
 * this formats them, and `inputMode="numeric"` becomes safe because nothing
 * unreachable is ever required.
 *
 * The trailing separator is deliberately **not** auto-appended: formatting
 * `1995` as `1995-` would put the caret after a character the player did not
 * type, and their next backspace would delete it only for the formatter to put
 * it straight back — a field that cannot be edited backwards. A separator
 * appears only once a digit follows it.
 */
const YEAR_DIGITS = 4;
const MONTH_DIGITS = 6;
const MAX_DIGITS = 8;

/** `YYYY-MM-DD` — the widest string {@link formatBirthDateInput} can return. */
export const BIRTH_DATE_MAX_LENGTH = 10;

export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_DIGITS);

  if (digits.length <= YEAR_DIGITS) {
    return digits;
  }

  if (digits.length <= MONTH_DIGITS) {
    return `${digits.slice(0, YEAR_DIGITS)}-${digits.slice(YEAR_DIGITS)}`;
  }

  return `${digits.slice(0, YEAR_DIGITS)}-${digits.slice(YEAR_DIGITS, MONTH_DIGITS)}-${digits.slice(MONTH_DIGITS)}`;
}
