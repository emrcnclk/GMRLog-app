import { Icon, IconButton } from '@gmrlog/ui';

import { ScreenHeader } from '../../../src/navigation/screen-header';

export interface ComposerHeaderProps {
  title: string;
  onClose: () => void;
  closeLabel?: string;
}

/**
 * Composer chrome. A composer is dismissed, not navigated back from, so the
 * leading control is an ✕ rather than the back chevron — the gesture it maps to
 * is "discard this sheet", and reusing the back affordance would promise the
 * wrong thing.
 */
export function ComposerHeader({ title, onClose, closeLabel = 'Close' }: ComposerHeaderProps) {
  return (
    <ScreenHeader
      title={title}
      titleRole="title"
      leading={
        <IconButton accessibilityLabel={closeLabel} size="lg" onPress={onClose} hitSlop={8}>
          <Icon name="x" decorative size={22} color="color.text.primary" />
        </IconButton>
      }
    />
  );
}
