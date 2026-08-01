import type { FieldError } from 'react-hook-form';

/**
 * Field copy surfaces after blur or submit — never while the player is still typing.
 */
export function visibleFieldError(
  error: FieldError | undefined,
  touched: boolean | undefined,
  isSubmitted: boolean,
): string | undefined {
  if (!error) {
    return undefined;
  }
  return touched === true || isSubmitted ? error.message : undefined;
}
