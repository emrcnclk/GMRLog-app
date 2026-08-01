import { Button, Dialog, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      visible={visible}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button
            variant="ghost"
            accessibilityLabel={cancelLabel}
            onPress={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            accessibilityLabel={confirmLabel}
            loading={loading}
            onPress={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <View style={{ gap: theme.space('space.2') }}>
        <Text role="body" color="color.text.secondary">
          {description}
        </Text>
      </View>
    </Dialog>
  );
}
