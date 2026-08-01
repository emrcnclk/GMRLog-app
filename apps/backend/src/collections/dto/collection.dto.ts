import {
  collectionCreateSchema,
  collectionEntriesPutSchema,
  collectionIdParamSchema,
  collectionPatchSchema,
  collectionsDiscoverQuerySchema,
  collectionsQuerySchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** S1 §14.10 CollectionCreateRequest. */
export class CollectionCreateDto extends createZodDto(collectionCreateSchema) {}

/** S1 §14.10 CollectionPatchRequest. */
export class CollectionPatchDto extends createZodDto(collectionPatchSchema) {}

/** Path param for `/collections/{id}`. */
export class CollectionIdParamDto extends createZodDto(collectionIdParamSchema) {}

/** S1 §13.8 — `GET /collections` query. */
export class CollectionsQueryDto extends createZodDto(collectionsQuerySchema) {}

/** S1 §14.11 CollectionEntriesPutRequest. */
export class CollectionEntriesPutDto extends createZodDto(collectionEntriesPutSchema) {}

/** D3.24 Collection Hub — `GET /collections/discover` query. */
export class CollectionsDiscoverQueryDto extends createZodDto(collectionsDiscoverQuerySchema) {}
