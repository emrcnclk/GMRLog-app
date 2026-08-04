/**
 * Ambient types for optional peer `lucide-react-native`.
 *
 * `@gmrlog/ui` doesn't carry the package as a real dependency, so its own
 * node_modules has no copy for tsc to read types from — this shim stands in.
 * Runtime resolution is best-effort; apps that install the peer (every app in
 * this monorepo does) get real icons via the hoisted install.
 *
 * Named exports are limited to the icons `Icon`'s static map (icon.tsx)
 * actually renders. Add an icon there and its name here together.
 */
declare module 'lucide-react-native' {
  import type { ComponentType } from 'react';

  export type LucideIcon = ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;

  export const Activity: LucideIcon;
  export const Bell: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Compass: LucideIcon;
  export const Folder: LucideIcon;
  export const LayoutGrid: LucideIcon;
  export const Library: LucideIcon;
  export const Link: LucideIcon;
  export const List: LucideIcon;
  export const ListOrdered: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Quote: LucideIcon;
  export const Search: LucideIcon;
  export const SearchX: LucideIcon;
  export const Share2: LucideIcon;
  export const Star: LucideIcon;
  export const Trophy: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Users: LucideIcon;
  export const X: LucideIcon;

  const icons: Record<string, LucideIcon | undefined>;
  export default icons;
}
