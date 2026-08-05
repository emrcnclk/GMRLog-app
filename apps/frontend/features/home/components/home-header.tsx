import {
  Icon,
  IconButton,
  LogoMark,
  SCREEN_GUTTER,
  SegmentedTabs,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HomeFeedFilter } from '../hooks/use-activity-feed';

export interface HomeHeaderProps {
  filter: HomeFeedFilter;
  onChangeFilter: (filter: HomeFeedFilter) => void;
  onPressSearch: () => void;
  onPressNotifications: () => void;
}

const FILTER_TABS = [
  { id: 'following', label: 'Following' },
  { id: 'for_you', label: 'For you' },
] as const;

/**
 * Home's sticky chrome (`SCREEN_REDESIGNS.md` §4) — wordmark, search/notifications
 * shortcuts, and the audience tab row, as one non-scrolling block above the feed.
 *
 * Not built on `NavHeader`/`ScreenHeader`: this shape (a compound wordmark mark,
 * two icon actions, and a tab strip beneath) doesn't fit that component's single
 * title + trailing slot, the same "compose locally" call `ProCard` and
 * `PresenceRail` already made for their own shapes. `SegmentedTabs` supplies the
 * one hairline at the foot of the whole block — no separate border is added above
 * it, so the header reads as a single unit ending in one rule, not two.
 *
 * §4 asks for `backdrop-filter: blur(18px)` over a translucent background. Every
 * other screen's "sticky" header in this effort (Messages' search field,
 * Collections' title) is a non-overlapping flow sibling above the scrolling list,
 * not a floating overlay with content passing underneath it — there is nothing
 * for a blur to show through here. Rendered at the same opaque
 * `color.background.primary` every other header in the app uses instead of
 * adding a blur dependency for no visible effect.
 */
export function HomeHeader({
  filter,
  onChangeFilter,
  onPressSearch,
  onPressNotifications,
}: HomeHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.space(SCREEN_GUTTER),
          paddingVertical: theme.space('space.3'),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
          <LogoMark size={13} />
          <Text role="label" color="color.text.primary">
            GMRLOG
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space('space.1') }}>
          <IconButton accessibilityLabel="Search" size="lg" onPress={onPressSearch} hitSlop={8}>
            <Icon name="search" decorative size={22} color="color.text.primary" />
          </IconButton>
          <IconButton
            accessibilityLabel="Notifications"
            size="lg"
            onPress={onPressNotifications}
            hitSlop={8}
          >
            <Icon name="bell" decorative size={22} color="color.text.primary" />
          </IconButton>
        </View>
      </View>

      <SegmentedTabs
        items={FILTER_TABS}
        activeId={filter}
        onChange={onChangeFilter}
        variant="underline"
        accessibilityLabel="Feed audience"
      />
    </View>
  );
}
