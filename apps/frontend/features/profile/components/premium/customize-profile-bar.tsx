import { Button, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface CustomizeProfileBarProps {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  saving: boolean;
}

/**
 * §18's sticky bar — Cancel / "Customize" / Save, the same three-equal-column
 * shape as `ReviewComposerBar` (§16, 3b.4): the title stays centred regardless
 * of how wide either action renders, since neither is a fixed size.
 */
export function CustomizeProfileBar({
  onCancel,
  onSave,
  saveDisabled,
  saving,
}: CustomizeProfileBarProps) {
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
          alignItems: 'center',
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.2'),
          minHeight: theme.space('space.12'),
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Button variant="ghost" size="sm" accessibilityLabel="Cancel" onPress={onCancel}>
            Cancel
          </Button>
        </View>
        <Text role="title" color="color.text.primary" style={{ flex: 1, textAlign: 'center' }}>
          Customize
        </Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Button
            variant="accent"
            size="sm"
            accessibilityLabel="Save profile theme"
            disabled={saveDisabled}
            loading={saving}
            onPress={onSave}
          >
            Save
          </Button>
        </View>
      </View>
    </View>
  );
}
