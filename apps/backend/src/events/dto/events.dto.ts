import {
  eventCreateSchema,
  eventIdParamSchema,
  eventInviteSchema,
  eventRsvpSchema,
  participationSchema,
} from '@gmrlog/validators';

import { createZodDto } from '../../infrastructure/http/zod-validation.pipe';

/** Path `{id}` for `/events/{id}` and participation child routes. */
export class EventIdParamDto extends createZodDto(eventIdParamSchema) {}

/** S1 §14.16 — empty participation body. */
export class ParticipationDto extends createZodDto(participationSchema) {}

/** D3.24 EVENTS_V2 — LFG RSVP body. */
export class EventRsvpDto extends createZodDto(eventRsvpSchema) {}

/** D3.24 EVENTS_V2 — invite friends body. */
export class EventInviteDto extends createZodDto(eventInviteSchema) {}

/** D3.24 EVENTS_V2 — `POST /events` create body. */
export class EventCreateDto extends createZodDto(eventCreateSchema) {}
