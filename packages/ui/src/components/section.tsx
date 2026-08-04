import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { SectionKicker } from './section-kicker';
import { Text } from './text';

export interface SectionProps {
  /** The section's name. Rendered as a kicker, not as a heading. */
  title?: string;
  /** Right-aligned counter beside the kicker. Pre-formatted. */
  counter?: string;
  /** Right-aligned text link beside the kicker, e.g. "All 412 →". */
  actionLabel?: string;
  onPressAction?: () => void;
  /** Optional line under the kicker, for a section that needs one sentence of context. */
  description?: string;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Group with one purpose (F4.4 · S4 Section), opened by a `SectionKicker`.
 *
 * The title used to render at `heading` — a 25px light line that read as a page
 * title sitting inside a page. The redesign removes that treatment everywhere:
 * a section announces itself with a tracked-out monospace label and lets space
 * do the separating.
 */
export function Section({
  title,
  counter,
  actionLabel,
  onPressAction,
  description,
  children,
  style,
}: SectionProps) {
  const theme = useTheme();

  return (
    <View style={[{ gap: theme.space('space.3') }, style]}>
      {title !== undefined ? (
        <View style={{ gap: theme.space('space.1') }}>
          <SectionKicker
            title={title}
            counter={counter}
            actionLabel={actionLabel}
            onPressAction={onPressAction}
          />
          {description !== undefined ? (
            <Text role="meta" color="color.text.tertiary">
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
