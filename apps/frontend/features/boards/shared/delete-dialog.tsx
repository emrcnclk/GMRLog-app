import { ConfirmDialog } from '../../content/components/confirm-dialog';

export interface DeleteDialogProps {
  visible: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Danger confirm dialog for board deletes. */
export function DeleteDialog({
  visible,
  title,
  description,
  loading = false,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      visible={visible}
      title={title}
      description={description}
      confirmLabel="Delete"
      danger
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
