import {
  communityCreateSchema,
  communityFeedQuerySchema,
  communityIdParamSchema,
  communityListQuerySchema,
  communityMemberRolePatchSchema,
  communityMemberUserParamSchema,
  communityPatchSchema,
  communityPinCreateSchema,
  communityPinIdParamSchema,
  communityWikiPageParamSchema,
  communityWikiUpsertSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1.1 CommunityCreateRequest. */
export class CommunityCreateDto extends createZodDto(communityCreateSchema) {}

/** S1.1 CommunityPatchRequest (+ D3.24 joinType). */
export class CommunityPatchDto extends createZodDto(communityPatchSchema) {}

/** Path `{id}` for `/communities/{id}` and child routes. */
export class CommunityIdParamDto extends createZodDto(communityIdParamSchema) {}

/** Path `{id}` + `{slug}` for wiki page routes. */
export class CommunityWikiPageParamDto extends createZodDto(communityWikiPageParamSchema) {}

/** Wiki upsert body. */
export class CommunityWikiUpsertDto extends createZodDto(communityWikiUpsertSchema) {}

/** Pin create body. */
export class CommunityPinCreateDto extends createZodDto(communityPinCreateSchema) {}

/** Path `{id}` + `{pinId}`. */
export class CommunityPinIdParamDto extends createZodDto(communityPinIdParamSchema) {}

/** Path `{id}` + `{userId}` for member role patch. */
export class CommunityMemberUserParamDto extends createZodDto(communityMemberUserParamSchema) {}

/** Member role patch body. */
export class CommunityMemberRolePatchDto extends createZodDto(communityMemberRolePatchSchema) {}

/** Community feed query (+ optional tab). */
export class CommunityFeedQueryDto extends createZodDto(communityFeedQuerySchema) {}

/** Directory list query — cursor + limit (S1 §5). */
export class CommunityListQueryDto extends createZodDto(communityListQuerySchema) {}
