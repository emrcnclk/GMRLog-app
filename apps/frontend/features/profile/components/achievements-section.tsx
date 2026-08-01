import type { AchievementResponse } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export interface AchievementsSectionProps {
  achievements: AchievementResponse[];
}

/** Overview awarded titles — restrained list · no engagement bait. */
export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const theme = useTheme();

  if (achievements.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingBottom: theme.space('space.2') }}>
      <Text
        role="title"
        color="color.text.primary"
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingTop: theme.space('space.4'),
          paddingBottom: theme.space('space.2'),
        }}
      >
        Achievements
      </Text>
      {achievements.map((item) => (
        <View
          key={item.id}
          accessibilityRole="text"
          accessibilityLabel={`${item.title}. ${item.description}`}
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.3'),
            borderBottomWidth: 1,
            borderBottomColor: theme.color('color.border.default'),
            gap: theme.space('space.1'),
          }}
        >
          <Text role="label" color="color.text.primary" numberOfLines={1}>
            {item.title}
          </Text>
          <Text role="body" color="color.text.secondary" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      ))}
    </View>
  );
}
