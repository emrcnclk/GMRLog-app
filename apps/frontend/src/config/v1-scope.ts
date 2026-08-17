/**
 * v1 scope gate (10.8). Product decision: Pro/subscription, the cosmetics store, and the
 * Studio/Publisher account surfaces ship post-v1 — reachable UI for them is hidden, not
 * deleted. This is the ONE switch: flip `POST_V1_SURFACES_ENABLED` to `true` to make every
 * gated nav entry, upsell surface, and route reachable again in one change.
 *
 * Gated by this flag: `ProCard` (settings hub), the cosmetics-store `ListItem` (customize
 * profile), and the `/(settings)/subscription`, `/(app)/profile/store`,
 * `/(app)/studio-analytics`, `/(app)/publisher-portfolio` routes (direct navigation redirects
 * away rather than rendering the screen).
 */
export const POST_V1_SURFACES_ENABLED = false as boolean;
