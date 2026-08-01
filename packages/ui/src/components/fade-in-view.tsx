import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { resolveDuration, type MotionDurationToken } from '../motion/tokens';

export interface FadeInViewProps {
  children: ReactNode;
  /** Re-runs the entrance whenever this changes — pass the active tab id. */
  triggerKey?: string | number;
  duration?: MotionDurationToken;
  /** Upward drift in px. Kept small; large travel reads as a layout shift. */
  offset?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Entrance transition for swapped content (tab panels, route bodies).
 *
 * Opacity and translate only — never height or layout — so the transition can
 * never cause a layout shift. Under reduce-motion it renders fully opaque and
 * un-translated on the first frame, with no animation scheduled at all.
 */
export function FadeInView({
  children,
  triggerKey,
  duration = 'normal',
  offset = 8,
  style,
}: FadeInViewProps) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: resolveDuration(duration, false),
      useNativeDriver: true,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, progress, reduceMotion, triggerKey]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
