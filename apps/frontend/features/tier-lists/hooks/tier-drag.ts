/**
 * Pure drop-target geometry for §20's tier board drag. Kept free of RNGH /
 * Reanimated so the targeting math is unit-testable without a native runtime.
 */
export interface DropZoneLayout {
  label: string;
  /** Page-space (measureInWindow) top edge, captured once when a drag begins. */
  y: number;
  height: number;
}

/** Which zone (tier row or the tray) a page-space Y point currently sits over, if any. */
export function resolveDropZone(zones: DropZoneLayout[], pointY: number): string | null {
  for (const zone of zones) {
    if (pointY >= zone.y && pointY < zone.y + zone.height) {
      return zone.label;
    }
  }
  return null;
}
