/**
 * Allowed offline mutation kinds — only operations already backed by existing APIs
 * with optimistic UI. Never invent unsupported offline behavior.
 */
export type OfflineMutationKind =
  | 'community.join'
  | 'community.leave'
  | 'event.join'
  | 'event.leave'
  | 'notifications.markRead'
  | 'notifications.markAllRead'
  | 'settings.appearance'
  | 'settings.accessibility';

export const OFFLINE_MUTATION_KINDS: readonly OfflineMutationKind[] = [
  'community.join',
  'community.leave',
  'event.join',
  'event.leave',
  'notifications.markRead',
  'notifications.markAllRead',
  'settings.appearance',
  'settings.accessibility',
] as const;

export function isOfflineMutationKind(value: string): value is OfflineMutationKind {
  return (OFFLINE_MUTATION_KINDS as readonly string[]).includes(value);
}

/** React Query mutation meta for durable offline retry. */
export function durableMeta(kind: OfflineMutationKind): Record<string, unknown> {
  return { durable: true, kind };
}
