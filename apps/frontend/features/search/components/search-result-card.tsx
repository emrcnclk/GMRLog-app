import type { SearchHit } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import {
  Award,
  Calendar,
  Folder,
  Gamepad2,
  ListOrdered,
  MessageSquare,
  Star,
  Tag,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

function hitIcon(type: SearchHit['type']): LucideIcon {
  switch (type) {
    case 'game':
      return Gamepad2;
    case 'user':
      return User;
    case 'review':
      return Star;
    case 'post':
      return MessageSquare;
    case 'collection':
      return Folder;
    case 'tier-list':
      return ListOrdered;
    case 'community':
      return Users;
    case 'event':
      return Calendar;
    case 'achievement':
      return Award;
    case 'tag':
      return Tag;
  }
}

function hitTitle(hit: SearchHit): string {
  switch (hit.type) {
    case 'game':
      return hit.summary.title;
    case 'user':
      return hit.summary.displayName;
    case 'review':
      return hit.summary.gameTitle;
    case 'post':
      return hit.summary.excerpt || 'Post';
    case 'collection':
      return hit.summary.title;
    case 'tier-list':
      return hit.summary.title;
    case 'community':
      return hit.summary.name;
    case 'event':
      return hit.summary.title;
    case 'achievement':
      return hit.summary.name;
    case 'tag':
      return hit.summary.name;
  }
}

function hitSubtitle(hit: SearchHit): string {
  switch (hit.type) {
    case 'game':
      return hit.summary.slug;
    case 'user':
      return `@${hit.summary.handle}`;
    case 'review':
      return hit.summary.excerpt || 'Review';
    case 'post':
      return 'Post';
    case 'collection':
      return 'Collection';
    case 'tier-list':
      return 'Tier list';
    case 'community':
      return 'Community';
    case 'event':
      return hit.summary.kind.replace(/_/g, ' ');
    case 'achievement':
      return hit.summary.category;
    case 'tag':
      return hit.summary.slug;
  }
}

export interface SearchResultCardProps {
  hit: SearchHit;
  onPress: () => void;
}

function SearchResultCardComponent({ hit, onPress }: SearchResultCardProps) {
  const theme = useTheme();
  const Icon = hitIcon(hit.type);
  const title = hitTitle(hit);
  const subtitle = hitSubtitle(hit);
  const iconBox = theme.space('space.10');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${hit.type}: ${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
        opacity: pressed ? 0.85 : 1,
        minHeight: theme.space('space.12'),
        alignItems: 'center',
      })}
    >
      {hit.type === 'user' ? (
        <Avatar size="md" initials={hit.summary.displayName.slice(0, 2)} />
      ) : hit.type === 'game' ? (
        <View
          accessibilityLabel="Game cover placeholder"
          style={{
            width: iconBox,
            height: iconBox,
            borderRadius: theme.radius('radius.md'),
            backgroundColor: theme.color('color.surface.secondary'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
        </View>
      ) : (
        <View
          style={{
            width: iconBox,
            height: iconBox,
            borderRadius: theme.radius('radius.md'),
            backgroundColor: theme.color('color.surface.secondary'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
        </View>
      )}

      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="label" color="color.text.primary" numberOfLines={1}>
          {title}
        </Text>
        <Text role="meta" color="color.text.secondary" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export const SearchResultCard = memo(SearchResultCardComponent);
