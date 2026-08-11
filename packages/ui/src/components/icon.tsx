import {
  Activity,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  Compass,
  Folder,
  LayoutGrid,
  Library,
  Link,
  List,
  ListOrdered,
  MessageCircle,
  MessageSquare,
  Quote,
  Search,
  SearchX,
  Share2,
  ShieldOff,
  Star,
  Trophy,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { HIDDEN_FROM_ASSISTIVE_TECH } from '../a11y/decorative';
import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

/**
 * Every name this app actually renders through `<Icon name="...">`, mapped to
 * a statically imported lucide component.
 *
 * Not a lookup by string-to-PascalCase conversion: that went through a dynamic
 * `require('lucide-react-native')`, which returns `undefined` on web (no
 * global `require` inside an ESM bundle) and silently fell back to the
 * placeholder box on every call site. `SettingsRow` and `profile-screen.tsx`
 * already sidestep the same bug by taking a component reference directly.
 * This map keeps the string-name API those two didn't need to touch, without
 * resurrecting the dynamic lookup. A name missing here is a bug — add it
 * rather than falling back silently.
 */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  bell: Bell,
  calendar: Calendar,
  check: Check,
  'chevron-left': ChevronLeft,
  compass: Compass,
  folder: Folder,
  'layout-grid': LayoutGrid,
  library: Library,
  link: Link,
  list: List,
  'list-ordered': ListOrdered,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  quote: Quote,
  search: Search,
  'search-x': SearchX,
  'share-2': Share2,
  'shield-off': ShieldOff,
  star: Star,
  trophy: Trophy,
  'user-plus': UserPlus,
  users: Users,
  x: X,
};

export interface IconProps {
  /** Lucide icon name, kebab-case (e.g. "search"). Must exist in `ICONS`. */
  name?: string;
  children?: ReactNode;
  size?: number;
  color?: SemanticColorToken;
  /**
   * Purely ornamental — hidden from VoiceOver / TalkBack.
   *
   * An icon that repeats meaning already carried by adjacent text, or that sits
   * inside an already-labelled control, must not be announced a second time. Use
   * this for every decorative glyph; leave it off only when the icon *is* the
   * information and nothing else conveys it.
   */
  decorative?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Thin icon wrapper — Lucide by name, children, or placeholder if peer missing.
 */
export function Icon({
  name,
  children,
  size = 24,
  color = 'color.text.primary',
  decorative = false,
  style,
}: IconProps) {
  const theme = useTheme();
  const resolvedColor = theme.color(color);
  const a11y = decorative ? HIDDEN_FROM_ASSISTIVE_TECH : null;

  if (children) {
    return (
      <View {...a11y} style={style}>
        {children}
      </View>
    );
  }

  if (name) {
    const LucideIcon = ICONS[name];
    if (LucideIcon) {
      return (
        <View
          style={style}
          {...(decorative
            ? a11y
            : { accessibilityRole: 'image' as const, accessibilityLabel: name })}
        >
          <LucideIcon size={size} color={resolvedColor} strokeWidth={1.75} />
        </View>
      );
    }
  }

  return (
    <View
      {...(decorative
        ? a11y
        : { accessibilityRole: 'image' as const, accessibilityLabel: name ?? 'Icon' })}
      style={[
        {
          width: size,
          height: size,
          borderRadius: theme.radius('radius.sm'),
          backgroundColor: theme.color('color.surface.secondary'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
        },
        style,
      ]}
    />
  );
}
