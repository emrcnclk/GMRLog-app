import { Icon, IconButton, SectionKicker, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PublisherPortfolioHeaderProps {
  title: string;
  onClose: () => void;
}

/**
 * §24's sticky bar: kicker, publisher name at `title2`, a close button —
 * the same header pattern §23's `StudioAnalyticsHeader` establishes (see
 * that component's doc comment for why this is bespoke rather than
 * `NavHeader`: no kicker slot, no `title2` role option). Publisher and
 * Studio are organisation surfaces sharing one chrome pattern per
 * `SCREEN_REDESIGNS_2.md`'s closing notes, so this mirrors that file
 * structurally rather than importing it — the two screens' entities
 * (`Company` vs. the still-nonexistent studio account) are unrelated, and a
 * shared component would couple them for no reason.
 *
 * `title` is the screen's own label ("Publisher portfolio"), not a real
 * publisher's name — see `publisher-portfolio-gap.tsx` for why: there is no
 * publisher account entity to source a viewer's own name from, the same gap
 * §23 recorded for studios.
 */
export function PublisherPortfolioHeader({ title, onClose }: PublisherPortfolioHeaderProps) {
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
          <SectionKicker title="Publisher · Portfolio" />
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
