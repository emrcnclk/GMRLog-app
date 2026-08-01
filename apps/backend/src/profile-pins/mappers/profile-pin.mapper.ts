import type { ProfilePin } from '@gmrlog/database';
import type { ProfilePinResponse } from '@gmrlog/types';

export function toProfilePinResponse(pin: ProfilePin): ProfilePinResponse {
  return {
    id: pin.id,
    kind: pin.kind,
    objectId: pin.objectId,
    position: pin.position,
  };
}
