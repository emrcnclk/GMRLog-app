import type { ComponentType, ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { HIDDEN_FROM_ASSISTIVE_TECH } from '../a11y/decorative';
import { useTheme } from '../theme/theme-provider';
import type { SemanticColorToken } from '../theme/tokens';

export interface IconProps {
  /** Lucide icon name in kebab-case or PascalCase (e.g. "search" / "Search"). */
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

type LucideIconComponent = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function loadLucideIcon(name: string): LucideIconComponent | null {
  try {
    const maybeRequire = (
      globalThis as typeof globalThis & {
        require?: (moduleId: string) => unknown;
      }
    ).require;

    if (typeof maybeRequire !== 'function') {
      return null;
    }

    const lucide = maybeRequire('lucide-react-native') as Record<
      string,
      LucideIconComponent | undefined
    >;
    const key = toPascalCase(name);
    return lucide[key] ?? null;
  } catch {
    return null;
  }
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
    const LucideIcon = loadLucideIcon(name);
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
