import type { ProfilePin } from '@gmrlog/database';
import type { ProfilePinResponse } from '@gmrlog/types';

/**
 * `profile_pin_kind` carries a fourth value, `achievement`, added by the
 * D3.29 migration (badge equip/pin) — schema-only, ahead of the feature that
 * writes it. `ProfilePinUpsertInput`/`ProfilePinResponse` stay at the three
 * kinds `ProfilePinsService.requirePinTarget` actually validates against;
 * widening them here would accept an `achievement` pin with no matching
 * ownership check (it would silently fall through to the collection branch).
 * No current write path can produce that row — this rejects it explicitly
 * rather than mistyping it past `ProfilePinResponse`.
 */
export function toProfilePinResponse(pin: ProfilePin): ProfilePinResponse {
  if (pin.kind === 'achievement') {
    throw new Error('Achievement profile pins are not supported yet (D3.29 Phase 2)');
  }
  return {
    id: pin.id,
    kind: pin.kind,
    objectId: pin.objectId,
    position: pin.position,
  };
}
