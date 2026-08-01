import type { DiscoverHubModule } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import {
  Calendar,
  Compass,
  Flame,
  Gamepad2,
  Gem,
  Library,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { memo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';

import { discoverModuleDescription, discoverModuleTitle } from '../hooks/discover-model';

export interface DiscoverModuleCardProps {
  module: DiscoverHubModule;
  onPress: () => void;
}

function ModuleIcon({ id }: { id: string }): ReactElement {
  const theme = useTheme();
  const color = theme.color('color.text.secondary');
  const props = { size: 24 as const, color, strokeWidth: 1.75 as const };
  switch (id) {
    case 'games':
      return <Gamepad2 {...props} />;
    case 'communities':
      return <Users {...props} />;
    case 'events':
      return <Calendar {...props} />;
    case 'trending':
      return <TrendingUp {...props} />;
    case 'popular':
      return <Flame {...props} />;
    case 'hidden-gems':
      return <Gem {...props} />;
    case 'recommended':
      return <Sparkles {...props} />;
    case 'collections':
      return <Library {...props} />;
    default:
      return <Compass {...props} />;
  }
}

function DiscoverModuleCardComponent({ module, onPress }: DiscoverModuleCardProps) {
  const theme = useTheme();
  const title = discoverModuleTitle(module.id);
  const description = discoverModuleDescription(module.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: theme.space('space.3'),
        padding: theme.space('space.4'),
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        opacity: pressed ? 0.85 : 1,
        minHeight: theme.space('space.16'),
        alignItems: 'center',
      })}
    >
      <View
        style={{
          width: theme.space('space.12'),
          height: theme.space('space.12'),
          borderRadius: theme.radius('radius.md'),
          backgroundColor: theme.color('color.surface.primary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ModuleIcon id={module.id} />
      </View>
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="title" color="color.text.primary">
          {title}
        </Text>
        <Text role="body" color="color.text.secondary">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export const DiscoverModuleCard = memo(DiscoverModuleCardComponent);
