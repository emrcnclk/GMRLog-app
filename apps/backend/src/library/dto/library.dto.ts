import {
  libraryEntriesQuerySchema,
  libraryEntryGameIdParamSchema,
  libraryEntryUpsertSchema,
  wishlistMetadataPatchSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.9 LibraryEntryUpsertRequest. */
export class LibraryEntryUpsertDto extends createZodDto(libraryEntryUpsertSchema) {}

/** S1 §13.9 — `filter[status]` query for shelf lists. */
export class LibraryEntriesQueryDto extends createZodDto(libraryEntriesQuerySchema) {}

/** Path param for `/library/entries/{gameId}`. */
export class LibraryEntryGameIdParamDto extends createZodDto(libraryEntryGameIdParamSchema) {}

/** D3.22 Wishlist++ — `PATCH /library/entries/{gameId}/wishlist-meta`. */
export class WishlistMetadataPatchDto extends createZodDto(wishlistMetadataPatchSchema) {}
