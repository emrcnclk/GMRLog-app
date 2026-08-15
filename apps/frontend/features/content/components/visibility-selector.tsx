import type { ContentVisibilityValue } from '@gmrlog/types';
import { Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

import { visibilityLabel, VISIBILITY_OPTIONS } from '../hooks/content-model';

export interface VisibilitySelectorProps {
  value: ContentVisibilityValue;
  onChange: (value: ContentVisibilityValue) => void;
  disabled?: boolean;
}

export function VisibilitySelector({ value, onChange, disabled = false }: VisibilitySelectorProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <Text role="label" color="color.text.secondary">
        Visibility
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
        {VISIBILITY_OPTIONS.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              aria-selected={selected}
              accessibilityLabel={`Visibility ${visibilityLabel(option)}`}
              disabled={disabled}
              onPress={() => {
                onChange(option);
              }}
              style={{
                minHeight: hit,
                paddingHorizontal: theme.space('space.3'),
                justifyContent: 'center',
                borderRadius: theme.radius('radius.md'),
                borderWidth: 1,
                borderColor: selected
                  ? theme.color('color.interactive.primary')
                  : theme.color('color.border.default'),
                backgroundColor: selected
                  ? theme.color('color.surface.secondary')
                  : theme.color('color.background.primary'),
              }}
            >
              <Text role="label" color={selected ? 'color.text.primary' : 'color.text.secondary'}>
                {visibilityLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
