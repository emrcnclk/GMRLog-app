import type { ProfilePin } from '@gmrlog/database';
import type { ProfilePinResponse } from '@gmrlog/types';

/**
 * `profile_pin_kind`'s fourth value, `achievement` (D3.29), is now a real,
 * validated write path — `ProfilePinsService.requirePinTarget` checks the
 * achievement exists and is awarded to the pinning user before a row can be
 * created (9.5d). The shape carries nothing beyond `objectId`, same as the
 * other three kinds; the frontend resolves it against the achievement it
 * already has loaded.
 */
export function toProfilePinResponse(pin: ProfilePin): ProfilePinResponse {
  return {
    id: pin.id,
    kind: pin.kind,
    objectId: pin.objectId,
    position: pin.position,
  };
}
