import { Icon, Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

const SQUARE_SIZE = 44;

/**
 * §16's attachments row. No `review_media` upload purpose and no clip/video
 * MIME support exist yet (`uploadPurposeSchema`, `UPLOAD_CONTENT_TYPES` in
 * `@gmrlog/validators`) — inert, same treatment `post-composer.tsx` already
 * gives its own disabled "Attach media" button for the identical gap.
 */
export function ReviewAttachmentsRow() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add screenshot"
          accessibilityState={{ disabled: true }}
          disabled
          style={{
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius('radius.md'),
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
            opacity: 0.5,
          }}
        >
          <Icon name="image" decorative size={20} color="color.text.secondary" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add clip"
          accessibilityState={{ disabled: true }}
          disabled
          style={{
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius('radius.md'),
            borderWidth: 1,
            borderColor: theme.color('color.border.default'),
            opacity: 0.5,
          }}
        >
          <Icon name="video" decorative size={20} color="color.text.secondary" />
        </Pressable>
      </View>
      <Text role="caption" color="color.text.tertiary">
        Screenshots and clips aren't available yet.
      </Text>
    </View>
  );
}
