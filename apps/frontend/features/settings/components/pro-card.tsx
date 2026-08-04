import { CornerNotch, MIN_TOUCH_TARGET, SCREEN_GUTTER, Text, useTheme } from '@gmrlog/ui';
import { Diamond } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

/**
 * The Pro card (SCREEN_REDESIGNS.md §9): "gradient surface, accent notch,
 * diamond icon, two lines of copy, chevron. It is the only coloured thing on
 * the screen."
 *
 * No literal gradient — `GradientScrim`'s own doc records that the design
 * system takes no gradient dependency, and that reasoning applies here too.
 * The distinction instead comes the way `Card` gets its depth (surface
 * lightness, not decoration): `color.background.elevated` plus an
 * `color.accent.muted` ring, with the notch and the diamond carrying the one
 * note of accent colour the screen allows itself.
 *
 * Not yet pressable — there is no subscription screen or route for it to open
 * (§9 doesn't specify one, and none is on TASKS.md). The chevron is the
 * spec's visual composition, not a promise of navigation yet.
 */
function ProCardComponent() {
  const theme = useTheme();

  return (
    <View
      style={{
        marginHorizontal: theme.space(SCREEN_GUTTER),
        marginBottom: theme.space(SCREEN_GUTTER),
        borderRadius: theme.radius('radius.lg'),
        borderWidth: 1,
        borderColor: theme.color('color.accent.muted'),
        backgroundColor: theme.color('color.background.elevated'),
        padding: theme.space('space.4'),
        minHeight: MIN_TOUCH_TARGET,
        overflow: 'hidden',
      }}
    >
      <CornerNotch />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}>
        <Diamond size={21} color={theme.color('color.accent.default')} />
        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text role="headline" color="color.text.primary">
            GMRLOG Pro
          </Text>
          <Text role="bodySm" color="color.text.tertiary">
            Widgets, themes, unlimited lists
          </Text>
        </View>
        <Text role="body" color="color.text.tertiary" accessibilityElementsHidden>
          ›
        </Text>
      </View>
    </View>
  );
}

export const ProCard = memo(ProCardComponent);
