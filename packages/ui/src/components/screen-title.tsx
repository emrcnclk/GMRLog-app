import { Pressable, View, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';

import { ProgressBar } from './progress-bar';
import { Text } from './text';

/**
 * The redesign's screen gutter (SCREEN_REDESIGNS.md §"Shared patterns" — 20px).
 *
 * Exported because the title block, the bleeding rail and the metric strip all
 * have to agree on it: a rail that bleeds against a 20px gutter while the title
 * above it sits at 16px reads as a misalignment, not as a bleed.
 */
export const SCREEN_GUTTER = 'space.5' as const;

export interface ScreenTitleProps {
  title: string;
  /**
   * Monospace line under the title — "412 of 1,208 unlocked · 34%". Pre-formatted;
   * the block never formats numbers itself.
   */
  meta?: string;
  /** Back affordance. Pushed screens only — a tab root has nothing to go back to. */
  backLabel?: string;
  onPressBack?: () => void;
  /** Draws the optional 2px rule under the meta line. Both are required to show it. */
  progressValue?: number;
  progressTarget?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The top of Achievements, Collections, Notifications, Messages, Settings and
 * Events (SCREEN_REDESIGNS.md §"Shared patterns").
 *
 * **The title belongs to the content, not to the chrome.** It scrolls away with
 * the list rather than sitting in a bar above it, which is why this is not
 * `NavHeader` and must not be placed inside one. `NavHeader` stays reserved for
 * pushed detail screens.
 */
export function ScreenTitle({
  title,
  meta,
  backLabel,
  onPressBack,
  progressValue,
  progressTarget,
  style,
}: ScreenTitleProps) {
  const theme = useTheme();
  const showBack = backLabel !== undefined && onPressBack !== undefined;
  const showProgress = progressValue !== undefined && progressTarget !== undefined;

  return (
    <View
      style={[
        {
          paddingTop: theme.space(SCREEN_GUTTER),
          paddingHorizontal: theme.space(SCREEN_GUTTER),
          paddingBottom: theme.space('space.4'),
          gap: theme.space('space.2'),
        },
        style,
      ]}
    >
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onPressBack}
          hitSlop={12}
          style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        >
          <Text role="label" color="color.text.tertiary">
            {backLabel}
          </Text>
        </Pressable>
      ) : null}

      <Text role="title1" accessibilityRole="header" numberOfLines={2}>
        {title}
      </Text>

      {meta !== undefined ? (
        <Text role="meta" color="color.text.tertiary">
          {meta}
        </Text>
      ) : null}

      {showProgress ? (
        <ProgressBar
          value={progressValue}
          target={progressTarget}
          height={2}
          // The meta line above already states the figures in words; announcing
          // them twice makes the header read as two separate controls.
          style={{ marginTop: theme.space('space.1') }}
        />
      ) : null}
    </View>
  );
}
