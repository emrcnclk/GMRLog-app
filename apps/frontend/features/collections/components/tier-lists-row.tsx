import { Icon, ListItem, SCREEN_GUTTER, Text, useTheme } from '@gmrlog/ui';

import { useTierLists } from '../../tier-lists';

export interface TierListsRowProps {
  onPress: () => void;
}

/**
 * The "Tier lists" entry row `SCREEN_REDESIGNS.md` §10 puts above the
 * collection list — accent-tinted border, icon, two lines, chevron. Same ring
 * treatment as `ProCard` (§9): `color.accent.muted` border, no fill, since the
 * accent is a line here too.
 *
 * The second line is a real count, not placeholder copy — `useTierLists` is
 * the same list query the Tier Lists screen itself renders from, so this ships
 * warm to that screen's cache rather than costing it a second round trip.
 * While that query is in flight or empty, the line falls back to a plain
 * description so the row is never left with a blank second line.
 */
export function TierListsRow({ onPress }: TierListsRowProps) {
  const theme = useTheme();
  const tierLists = useTierLists();
  const count = tierLists.status === 'ready' ? tierLists.items.length : null;
  const subtitle =
    count === null
      ? 'Rank your favorite games'
      : `${String(count)} ${count === 1 ? 'tier list' : 'tier lists'}`;

  return (
    <ListItem
      title="Tier lists"
      subtitle={subtitle}
      accessibilityLabel={`Tier lists, ${subtitle}`}
      onPress={onPress}
      leading={<Icon name="list-ordered" decorative size={20} color="color.accent.default" />}
      trailing={
        <Text role="body" color="color.text.tertiary" accessibilityElementsHidden>
          ›
        </Text>
      }
      style={{
        marginHorizontal: theme.space(SCREEN_GUTTER),
        marginTop: theme.space('space.4'),
        marginBottom: theme.space('space.2'),
        borderRadius: theme.radius('radius.lg'),
        borderWidth: 1,
        borderColor: theme.color('color.accent.muted'),
        backgroundColor: theme.color('color.background.elevated'),
      }}
    />
  );
}
