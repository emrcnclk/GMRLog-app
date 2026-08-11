import { Button, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ReviewComposerBarProps {
  onCancel: () => void;
  publishLabel: string;
  onPublish: () => void;
  publishDisabled: boolean;
  publishing: boolean;
}

/**
 * §16's sticky bar — Cancel / "Review" / Publish, not the generic ✕+title
 * `ComposerHeader` every other composer uses. Three equal-width flex
 * columns keep the title centred regardless of how wide Cancel or the
 * Publish pill render, since neither is a fixed size.
 */
export function ReviewComposerBar({
  onCancel,
  publishLabel,
  onPublish,
  publishDisabled,
  publishing,
}: ReviewComposerBarProps) {
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
          Review
        </Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Button
            variant="accent"
            size="sm"
            accessibilityLabel={publishLabel}
            disabled={publishDisabled}
            loading={publishing}
            onPress={onPublish}
            style={{ borderRadius: theme.radius('radius.full') }}
          >
            {publishLabel}
          </Button>
        </View>
      </View>
    </View>
  );
}
