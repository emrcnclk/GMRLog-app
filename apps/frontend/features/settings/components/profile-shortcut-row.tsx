import { ListItem, Text } from '@gmrlog/ui';
import { memo } from 'react';

export interface ProfileShortcutRowProps {
  handle: string;
  onPress: () => void;
}

function ProfileShortcutRowComponent({ handle, onPress }: ProfileShortcutRowProps) {
  return (
    <ListItem
      title="Edit profile"
      subtitle={`@${handle}`}
      accessibilityLabel="Open profile"
      onPress={onPress}
      trailing={
        <Text role="meta" color="color.text.tertiary">
          ›
        </Text>
      }
    />
  );
}

export const ProfileShortcutRow = memo(ProfileShortcutRowComponent);
