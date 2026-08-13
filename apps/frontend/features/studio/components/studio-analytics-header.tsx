import { Icon, IconButton, SectionKicker, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface StudioAnalyticsHeaderProps {
  title: string;
  onClose: () => void;
}

/**
 * §23's sticky bar: kicker, studio name at `title2` (25px/300 — the same role
 * §22's Tournament title already confirmed as the exact match), a close
 * button. Bespoke rather than `NavHeader`/`ScreenHeader`: that component has
 * no kicker slot (only a single `subtitle` line *under* the title, not above
 * it) and no `title2` role option (`heading`|`title` only) — the same reason
 * `TournamentHeader` (§22) is its own component rather than a `NavHeader`
 * call. Unlike that header this one is flat chrome, not a hero: no banner,
 * no gradient substitute, because §23 draws none.
 *
 * `title` is the screen's own label ("Studio analytics"), not a real studio's
 * name — see `studio-analytics-gap.tsx` for why: there is no studio/publisher
 * account entity anywhere in the schema, so there is no per-viewer name to
 * source it from. Passing a real name here once that entity exists is a
 * one-line change; nothing else about this component needs to move.
 */
export function StudioAnalyticsHeader({ title, onClose }: StudioAnalyticsHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.color('color.background.primary'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: theme.space('space.3'),
          paddingHorizontal: theme.space('space.4'),
          paddingTop: theme.space('space.3'),
          paddingBottom: theme.space('space.3'),
        }}
      >
        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <SectionKicker title="Studio · Analytics" />
          <Text role="title2" color="color.text.primary" numberOfLines={1}>
            {title}
          </Text>
        </View>

        <IconButton accessibilityLabel="Close" size="lg" onPress={onClose} hitSlop={8}>
          <Icon name="x" decorative size={22} color="color.text.primary" />
        </IconButton>
      </View>
    </View>
  );
}
