import { BottomSheet, type BottomSheetAnchor, MIN_TOUCH_TARGET, Text, useTheme } from '@gmrlog/ui';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export interface TierListOwnerMenuProps {
  anchor: BottomSheetAnchor | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * §20 draws no owner-management affordance at all — Fork/Like/Share is the
 * whole action row, and dragging replaces the old separate "Builder" screen.
 * Rename and delete are real capabilities the pre-redesign screen exposed as
 * inline buttons (`EditTierListScreen`, `DeleteDialog` are untouched by this
 * task); dropping them silently would be a regression the spec never asked
 * for, so they move behind an overflow control the way §14's Community detail
 * already does it (`CommunityOwnerMenu`, same `BottomSheet.anchor` primitive).
 */
export function TierListOwnerMenu({ anchor, onClose, onEdit, onDelete }: TierListOwnerMenuProps) {
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
