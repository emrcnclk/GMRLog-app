/**
 * Discover re-exports the Event domain mapper (S1 §15.6).
 * Hub lists omit viewerParticipation (null) — detail mounts it in EventsService.
 */
export { toEventResponse } from '../../events/mappers/event.mapper';
