import type { Notification } from '@gmrlog/database';
import type { NotificationResponse } from '@gmrlog/types';

/**
 * Persistence → S1 §15.9 NotificationResponse.
 * No actor column on S2 Notification — actor is always null.
 * messageKey mirrors kind as the localization key until NotificationKind is amended.
 */
export function toNotificationResponse(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    kind: notification.kind,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    actor: null,
    objectRef: {
      type: notification.objectType,
      id: notification.objectId,
    },
    messageKey: notification.kind,
  };
}
