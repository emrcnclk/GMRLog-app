/**
 * BullMQ rejects custom job ids that contain `:`.
 * Keep a readable, stable id by swapping colons for hyphens.
 */
export function toBullJobId(value: string): string {
  return value.replaceAll(':', '-');
}
