import { gameHubFeedQuerySchema, gameIdParamSchema } from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** Path param for `/games/{id}/hub` and every Game Hub sub-tab route. */
export class GameHubIdParamDto extends createZodDto(gameIdParamSchema) {}

/** `GET /games/{id}/feed` — cursor + limit only (GAME_HUB.md — no tab filter). */
export class GameHubFeedQueryDto extends createZodDto(gameHubFeedQuerySchema) {}
