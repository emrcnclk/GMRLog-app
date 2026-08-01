import {
  friendRequestCreateSchema,
  friendRequestIdParamSchema,
  friendUserIdParamSchema,
  friendsListQuerySchema,
  friendsSearchQuerySchema,
  presenceUpdateSchema,
  activityQuerySchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** SOCIAL_API — optional message on send friend request. */
export class FriendRequestCreateDto extends createZodDto(friendRequestCreateSchema) {}

/** Path `{requestId}` for accept / reject / cancel. */
export class FriendRequestIdParamDto extends createZodDto(friendRequestIdParamSchema) {}

/** Path `{userId}` for friend / relationship / presence routes. */
export class FriendUserIdParamDto extends createZodDto(friendUserIdParamSchema) {}

/** Cursor + limit (+ optional `q`) for friends lists. */
export class FriendsListQueryDto extends createZodDto(friendsListQuerySchema) {}

/** Required `q` for `GET /friends/search`. */
export class FriendsSearchQueryDto extends createZodDto(friendsSearchQuerySchema) {}

/** Presence status patch body. */
export class PresenceUpdateDto extends createZodDto(presenceUpdateSchema) {}

/** Cursor pagination for friend activity. */
export class FriendsActivityQueryDto extends createZodDto(activityQuerySchema) {}
