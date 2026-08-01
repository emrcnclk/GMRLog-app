import type { ReactNode } from 'react';
import { Modal, Pressable, View, type ViewStyle } from 'react-native';

import { bottomSheetMotion } from '../motion/bottom-sheet';
import { useReduceMotion } from '../motion/motion-provider';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface BottomSheetProps {
  title?: string;
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Simple Modal-based sheet — no gorhom dependency (structural sheet chrome).
 * Slide animation respects reduce-motion.
 */
export function BottomSheet({ title, children, visible, onClose, style }: BottomSheetProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const motion = bottomSheetMotion(reduceMotion);
  const shadow = theme.elevation('shadow.lg');

  return (
    <Modal
      visible={visible}
      transparent
      animationType={motion.animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: theme.color('color.text.primary'),
            opacity: 0.4,
          }}
        />
        <View
          accessibilityRole="summary"
          style={[
            {
              backgroundColor: theme.color('color.surface.dialog'),
              borderTopLeftRadius: theme.radius('radius.xl'),
              borderTopRightRadius: theme.radius('radius.xl'),
              paddingHorizontal: theme.space('space.4'),
              paddingTop: theme.space('space.4'),
              paddingBottom: theme.space('space.6'),
              gap: theme.space('space.3'),
              maxHeight: '80%',
              ...shadow,
            },
            style,
          ]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              alignSelf: 'center',
              width: theme.space('space.10'),
              height: theme.space('space.1'),
              borderRadius: theme.radius('radius.full'),
              backgroundColor: theme.color('color.border.default'),
              marginBottom: theme.space('space.1'),
            }}
          />
          {title ? (
            <Text role="title" color="color.text.primary">
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
