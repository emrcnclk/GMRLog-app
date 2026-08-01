import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import type { SemanticTypeRole } from '../theme/tokens';

import { Icon } from './icon';
import { IconButton } from './icon-button';
import { Text } from './text';

export interface NavHeaderProps {
  title: string;
  /** Second line under the title — count, filter, or provenance. */
  subtitle?: string;
  /**
   * Safe-area top padding, in points.
   *
   * `@gmrlog/ui` deliberately takes no safe-area peer dependency (see `Screen`),
   * so the inset is supplied by the app layer rather than read here. Omitting it
   * is correct for a header that is not the topmost element on the screen.
   */
  topInset?: number;
  /** Replaces the default back affordance entirely. */
  leading?: ReactNode;
  /** Trailing actions — keep to two at most so the title keeps its room. */
  trailing?: ReactNode;
  /** Renders the back chevron. Ignored when `leading` is supplied. */
  onBack?: () => void;
  /** Spoken label for the back control. Name the destination where you can. */
  backLabel?: string;
  /**
   * `heading` (24pt) for a tab root, `title` (18pt) for a pushed screen where the
   * content below deserves the emphasis.
   */
  titleRole?: Extract<SemanticTypeRole, 'heading' | 'title'>;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Structural top app bar chrome — no product destinations (S4 ScreenChrome partial).
 *
 * Every screen-level header in GMRLOG is this component. Before D3.28 it had no
 * way to consume a safe-area inset, so 28 screens hand-rolled the bar instead
 * and the back affordance, bar height, and title size drifted apart. `topInset`
 * closes that gap: the app layer measures, this component lays out.
 */
export function NavHeader({
  title,
  subtitle,
  topInset = 0,
  leading,
  trailing,
  onBack,
  backLabel = 'Go back',
  titleRole = 'heading',
  style,
}: NavHeaderProps) {
  const theme = useTheme();
  const barHeight = theme.space('space.12');

  return (
    <View
      style={[
        {
          paddingTop: topInset,
          backgroundColor: theme.color('color.background.primary'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.2'),
          minHeight: barHeight,
        }}
      >
        {leading ??
          (onBack ? (
            <IconButton
              accessibilityLabel={backLabel}
              size="lg"
              onPress={onBack}
              hitSlop={8}
              style={{ marginLeft: -theme.space('space.2') }}
            >
              <Icon
                name="chevron-left"
                decorative
                size={theme.space('space.6')}
                color="color.text.primary"
              />
            </IconButton>
          ) : null)}

        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text
            role={titleRole}
            color="color.text.primary"
            accessibilityRole="header"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {trailing}
      </View>
    </View>
  );
}
