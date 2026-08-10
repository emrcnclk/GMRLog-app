import { BottomSheet, type BottomSheetAnchor, MIN_TOUCH_TARGET, Text, useTheme } from '@gmrlog/ui';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export interface CommunityOwnerMenuProps {
  anchor: BottomSheetAnchor | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * §14's owner overflow (Edit / Delete), migrated onto the sheet/popover
 * primitive §15 built (`BottomSheet`'s `anchor` prop) — 3b.2 shipped it as an
 * inline hairline pair specifically because this primitive didn't exist yet;
 * `SocialActionMenu` (`features/social`) is the reference caller (3b.3b).
 */
export function CommunityOwnerMenu({ anchor, onClose, onEdit, onDelete }: CommunityOwnerMenuProps) {
  const theme = useTheme();

  return (
    <BottomSheet visible={anchor !== null} onClose={onClose} anchor={anchor}>
      <View style={{ gap: theme.space('space.1') }}>
        <MenuItem
          icon={<Pencil size={18} color={theme.color('color.text.secondary')} strokeWidth={1.75} />}
          label="Edit"
          onPress={() => {
            onClose();
            onEdit();
          }}
        />
        <MenuItem
          icon={<Trash2 size={18} color={theme.color('color.status.error')} strokeWidth={1.75} />}
          label="Delete"
          labelColor="color.status.error"
          onPress={() => {
            onClose();
            onDelete();
          }}
        />
      </View>
    </BottomSheet>
  );
}

function MenuItem({
  icon,
  label,
  labelColor = 'color.text.primary',
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: 'color.text.primary' | 'color.status.error';
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        minHeight: MIN_TOUCH_TARGET,
        paddingHorizontal: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
      }}
    >
      {icon}
      <Text role="body" color={labelColor}>
        {label}
      </Text>
    </Pressable>
  );
}
