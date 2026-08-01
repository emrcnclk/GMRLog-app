import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { HIDDEN_FROM_ASSISTIVE_TECH } from '../a11y/decorative';
import { useTheme } from '../theme/theme-provider';

import { Icon } from './icon';
import { Text } from './text';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /**
   * Lucide icon name for the medallion (e.g. `"compass"`). Ornamental by
   * definition — the title and description carry the meaning, so the medallion
   * is hidden from assistive technology and never announced.
   */
  icon?: string;
  /** Primary CTA — the one thing this surface wants the reader to do next. */
  action?: ReactNode;
  /** Optional lesser path, rendered under the primary. */
  secondaryAction?: ReactNode;
  /**
   * Grow to fill the parent and centre vertically. Use inside an otherwise
   * empty list or screen body; leave it off when the state sits inline in a rail.
   */
  fill?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The medallion glyph occupies nine sixteenths of the disc — derived from the
 * box so the two stay in proportion if the sizing token ever moves.
 */
const MEDALLION_GLYPH_RATIO = 9 / 16;

/**
 * Calm absence — one optional primary CTA, never FOMO/guilt (S4 EmptyState).
 *
 * An empty state has a job beyond looking tidy: teach what the surface is for,
 * then offer the single next action that fills it. The medallion, copy, and CTA
 * stack live here rather than being re-assembled per feature — layout drifting
 * between screens is what makes an app feel unfinished.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  fill = false,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const medallion = theme.space('space.16');
  const hasActions = action !== undefined || secondaryAction !== undefined;

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space('space.3'),
          padding: theme.space('space.6'),
        },
        fill ? { flexGrow: 1 } : null,
        style,
      ]}
    >
      {icon !== undefined ? (
        <View
          {...HIDDEN_FROM_ASSISTIVE_TECH}
          style={{
            width: medallion,
            height: medallion,
            borderRadius: theme.radius('radius.full'),
            backgroundColor: theme.color('color.surface.secondary'),
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.space('space.1'),
          }}
        >
          <Icon
            name={icon}
            decorative
            size={Math.round(medallion * MEDALLION_GLYPH_RATIO)}
            color="color.text.secondary"
          />
        </View>
      ) : null}

      <Text
        role="title"
        color="color.text.primary"
        accessibilityRole="header"
        style={{ textAlign: 'center' }}
      >
        {title}
      </Text>

      {description ? (
        <Text role="body" color="color.text.secondary" style={{ textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}

      {hasActions ? (
        <View style={{ marginTop: theme.space('space.2'), gap: theme.space('space.2') }}>
          {action}
          {secondaryAction}
        </View>
      ) : null}
    </View>
  );
}
