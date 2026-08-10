import type { ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';

import { bottomSheetMotion } from '../motion/bottom-sheet';
import { useReduceMotion } from '../motion/motion-provider';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface BottomSheetAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BottomSheetProps {
  title?: string;
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  style?: ViewStyle | ViewStyle[];
  /**
   * Web only: the trigger's measured window rect. When present on web, this
   * renders as a popover near the trigger instead of a bottom sheet — §15's
   * "a sheet on native, a popover on web". Native always ignores it: the sheet
   * is what §15 wants there regardless.
   */
  anchor?: BottomSheetAnchor | null;
}

/** Composition size for the popover — not on the space scale, same footing as `COMMUNITY_BANNER_HEIGHT`. */
const POPOVER_WIDTH = 220;

/**
 * Simple Modal-based sheet — no gorhom dependency (structural sheet chrome).
 * Slide animation respects reduce-motion.
 *
 * A hairline border reads the chrome's edge instead of a shadow — the design
 * language's menus and overflow surfaces lean on structure-from-space, not
 * elevation, the same reasoning §14's glass buttons follow (3b.3 measurement).
 */
export function BottomSheet({
  title,
  children,
  visible,
  onClose,
  style,
  anchor,
}: BottomSheetProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const motion = bottomSheetMotion(reduceMotion);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPopover = Platform.OS === 'web' && anchor != null;

  const gutter = theme.space('space.4');
  const popoverPosition = isPopover
    ? {
        position: 'absolute' as const,
        top: Math.min(anchor.y + anchor.height + theme.space('space.1'), windowHeight - gutter),
        left: Math.max(gutter, Math.min(anchor.x, windowWidth - POPOVER_WIDTH - gutter)),
        width: POPOVER_WIDTH,
      }
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isPopover ? 'fade' : motion.animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: isPopover ? 'flex-start' : 'flex-end' }}>
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
            // A popover doesn't dim the page behind it — only a sheet does.
            backgroundColor: isPopover ? 'transparent' : theme.color('color.text.primary'),
            opacity: isPopover ? 0 : 0.4,
          }}
        />
        <View
          accessibilityRole="summary"
          style={[
            isPopover
              ? {
                  backgroundColor: theme.color('color.surface.dialog'),
                  borderRadius: theme.radius('radius.lg'),
                  borderWidth: 1,
                  borderColor: theme.color('color.border.default'),
                  padding: theme.space('space.2'),
                  gap: theme.space('space.1'),
                  ...popoverPosition,
                }
              : {
                  backgroundColor: theme.color('color.surface.dialog'),
                  borderTopLeftRadius: theme.radius('radius.xl'),
                  borderTopRightRadius: theme.radius('radius.xl'),
                  borderWidth: 1,
                  borderColor: theme.color('color.border.default'),
                  paddingHorizontal: theme.space('space.4'),
                  paddingTop: theme.space('space.4'),
                  paddingBottom: theme.space('space.6'),
                  gap: theme.space('space.3'),
                  maxHeight: '80%',
                },
            style,
          ]}
        >
          {isPopover ? null : (
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
          )}
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
