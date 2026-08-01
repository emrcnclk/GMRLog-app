/**
 * Bundle optimization notes consumed by audits (D3.15).
 * Metro does not ship a built-in analyzer in-repo — findings are documented here for CI/report.
 */

export const BUNDLE_SPLIT_CANDIDATES = [
  'features/settings/**',
  'features/tier-lists/**',
  'features/collections/**',
  'features/messages/**',
  'features/communities/**',
] as const;

export const TREE_SHAKE_SAFE_IMPORTS = [
  'lucide-react-native (named icons only)',
  '@gmrlog/ui (barrel already tree-shake friendly via package exports)',
] as const;

export const DEAD_CODE_GUARDS = [
  'No Alert() usage',
  'Monitoring providers disabled (noop adapters)',
  'Production logger silent',
] as const;
