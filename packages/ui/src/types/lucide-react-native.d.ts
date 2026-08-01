/**
 * Ambient types for optional peer `lucide-react-native`.
 * Runtime resolution is best-effort; apps that install the peer get real icons.
 */
declare module 'lucide-react-native' {
  import type { ComponentType } from 'react';

  export type LucideIcon = ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;

  const icons: Record<string, LucideIcon | undefined>;
  export default icons;
}
