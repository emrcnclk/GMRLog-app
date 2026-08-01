import {
  conversationCreateSchema,
  conversationIdParamSchema,
  messageCreateSchema,
  messageListQuerySchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.21 ConversationCreateRequest. */
export class ConversationCreateDto extends createZodDto(conversationCreateSchema) {}

/** S1 §14.21 MessageCreateRequest. */
export class MessageCreateDto extends createZodDto(messageCreateSchema) {}

/** Path `{id}` for `/conversations/{id}` and child routes. */
export class ConversationIdParamDto extends createZodDto(conversationIdParamSchema) {}

/** S1 §5 — cursor + limit for `GET /conversations/{id}/messages`. */
export class MessageListQueryDto extends createZodDto(messageListQuerySchema) {}
