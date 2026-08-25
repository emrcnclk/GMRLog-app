import type { ReactNode } from 'react';
import { Modal, Pressable, View, type ViewStyle } from 'react-native';

import { modalMotion } from '../motion/modal';
import { useReduceMotion } from '../motion/motion-provider';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface DialogProps {
  title?: string;
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  actions?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Centered modal dialog — structural chrome only (S4 Dialog).
 * Enter/exit animation respects reduce-motion.
 */
export function Dialog({ title, children, visible, onClose, actions, style }: DialogProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const motion = modalMotion(reduceMotion);
  const shadow = theme.elevation('shadow.xl');

  return (
    <Modal
      visible={visible}
      transparent
      animationType={motion.animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: theme.space('space.4'),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: theme.color('color.text.primary'),
            opacity: motion.backdropOpacity,
          }}
        />
        <View
          // `accessibilityRole="summary"` was here and reached the DOM as
          // `role="region"` — a landmark, not a dialog. RNW's `Modal` does put
          // `aria-modal="true"` on its own outer container, but that container
          // carries no role, and `aria-modal` on a roleless element announces
          // nothing. Measured on the delete-account confirmation: a screen
          // reader was told "region", never "dialog".
          //
          // `role="dialog"` is the cross-platform spelling, not a web-only
          // prop: React Native's own `Role` union lists `dialog`
          // (`Libraries/Components/View/ViewAccessibility.js`) and RNW derives
          // the DOM `role` from it. `accessibilityViewIsModal` is the iOS
          // counterpart for containing VoiceOver inside the dialog.
          role="dialog"
          aria-modal
          aria-label={title}
          accessibilityViewIsModal
          style={[
            {
              width: '100%',
              maxWidth: 420,
              backgroundColor: theme.color('color.surface.dialog'),
              borderRadius: theme.radius('radius.lg'),
              padding: theme.space('space.5'),
              gap: theme.space('space.3'),
              ...shadow,
            },
            style,
          ]}
        >
          {title ? (
            <Text role="title" color="color.text.primary">
              {title}
            </Text>
          ) : null}
          {children}
          {actions ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: theme.space('space.2'),
                marginTop: theme.space('space.2'),
              }}
            >
              {actions}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
