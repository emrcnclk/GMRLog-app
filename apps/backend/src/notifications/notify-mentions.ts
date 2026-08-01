import type { NotificationRepository, UserRepository } from '@gmrlog/database';

const NOTIFICATION_KIND_MENTION = 'mention';

/** Handles like `@gamer_one` — letter/digit/underscore, 1–32 after @. */
const MENTION_HANDLE_RE = /(?:^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,32})\b/g;

/**
 * Emit `mention` notifications for unique @handles in body.
 * Never notifies the actor; skips unknown / soft-deleted handles.
 */
export async function notifyMentions(input: {
  body: string;
  actorId: string;
  objectType: 'post' | 'comment';
  objectId: string;
  users: UserRepository;
  notifications: NotificationRepository;
}): Promise<void> {
  const handles = extractMentionHandles(input.body);
  if (handles.length === 0) {
    return;
  }

  const notified = new Set<string>();
  for (const handle of handles) {
    const user = await input.users.findByHandle(handle);
    if (user == null || user.deletedAt != null) {
      continue;
    }
    if (user.id === input.actorId || notified.has(user.id)) {
      continue;
    }
    notified.add(user.id);
    await input.notifications.create({
      recipient: { connect: { id: user.id } },
      kind: NOTIFICATION_KIND_MENTION,
      objectType: input.objectType,
      objectId: input.objectId,
    });
  }
}

export function extractMentionHandles(body: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(MENTION_HANDLE_RE)) {
    const handle = match[1];
    if (handle === undefined) {
      continue;
    }
    const key = handle.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    found.push(handle);
  }
  return found;
}
