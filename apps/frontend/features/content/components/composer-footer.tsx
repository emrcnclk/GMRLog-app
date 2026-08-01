import { Button, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ComposerFooterProps {
  onSave: () => void;
  saveLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  deleteLoading?: boolean;
  characterCount?: number;
  characterMax?: number;
}

export function ComposerFooter({
  onSave,
  saveLabel = 'Save',
  disabled = false,
  loading = false,
  onDelete,
  deleteLabel = 'Delete',
  deleteLoading = false,
  characterCount,
  characterMax,
}: ComposerFooterProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.color('color.border.default'),
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.3'),
        paddingBottom: insets.bottom + theme.space('space.3'),
        gap: theme.space('space.3'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      {characterCount !== undefined && characterMax !== undefined ? (
        <Text role="caption" color="color.text.tertiary" style={{ textAlign: 'right' }}>
          {String(characterCount)} / {String(characterMax)}
        </Text>
      ) : null}
      <View
        style={{ flexDirection: 'row', gap: theme.space('space.2'), justifyContent: 'flex-end' }}
      >
        {onDelete ? (
          <Button
            variant="danger"
            accessibilityLabel={deleteLabel}
            loading={deleteLoading}
            disabled={loading}
            onPress={onDelete}
          >
            {deleteLabel}
          </Button>
        ) : null}
        <Button
          variant="primary"
          accessibilityLabel={saveLabel}
          loading={loading}
          disabled={disabled}
          onPress={onSave}
        >
          {saveLabel}
        </Button>
      </View>
    </View>
  );
}
