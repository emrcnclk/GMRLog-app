import { Badge, Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

export interface SpoilerBadgeProps {
  active: boolean;
  /** When provided, renders as a toggle control. */
  onChange?: (active: boolean) => void;
  disabled?: boolean;
}

/** Spoiler mark — display badge or toggle control. */
export function SpoilerBadge({ active, onChange, disabled = false }: SpoilerBadgeProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');

  if (!onChange) {
    if (!active) {
      return null;
    }
    return <Badge tone="warning">Spoilers</Badge>;
  }

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <Text role="label" color="color.text.secondary">
        Spoilers
      </Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: active, disabled }}
        accessibilityLabel="Contains spoilers"
        disabled={disabled}
        onPress={() => {
          onChange(!active);
        }}
        style={{
          minHeight: hit,
          paddingHorizontal: theme.space('space.3'),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: theme.radius('radius.md'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
          backgroundColor: theme.color('color.surface.secondary'),
        }}
      >
        <Text role="body" color="color.text.primary">
          {active ? 'Contains spoilers' : 'No spoilers'}
        </Text>
        <Badge tone={active ? 'warning' : 'neutral'}>{active ? 'On' : 'Off'}</Badge>
      </Pressable>
    </View>
  );
}
