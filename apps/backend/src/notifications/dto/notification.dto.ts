import { notificationListQuerySchema, notificationsReadSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §5 + §6.2 — list query for `/notifications`. */
export class NotificationListQueryDto extends createZodDto(notificationListQuerySchema) {}

/** S1 §14.22 NotificationsReadRequest. */
export class NotificationsReadDto extends createZodDto(notificationsReadSchema) {}
