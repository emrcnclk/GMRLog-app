import { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../motion/motion-provider';
import { MIN_TOUCH_TARGET } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  /** Rendered as a trailing count pill when present. `0` still renders. */
  count?: number;
}

export interface SegmentedTabsProps<T extends string> {
  items: readonly SegmentedTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  /** `underline` reads as page navigation; `pill` reads as a filter. */
  variant?: 'underline' | 'pill';
  /** Describes the tab set for assistive tech (e.g. "Game hub sections"). */
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Horizontally scrollable tab strip. Single implementation for every tabbed
 * surface — profile, game hub, collections — so tab behaviour (touch target,
 * selected state, keeping the active tab on screen) is identical everywhere.
 */
export function SegmentedTabs<T extends string>({
  items,
  activeId,
  onChange,
  variant = 'underline',
  accessibilityLabel,
  style,
}: SegmentedTabsProps<T>) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef(new Map<T, number>());

  const recordLayout = useCallback((id: T, event: LayoutChangeEvent) => {
    offsets.current.set(id, event.nativeEvent.layout.x);
  }, []);

  // Keep the selected tab visible when selection changes from outside a tap
  // (deep link, restored tab preference, swipe).
  useEffect(() => {
    const x = offsets.current.get(activeId);
    if (x === undefined) {
      return;
    }
    scrollRef.current?.scrollTo({
      x: Math.max(0, x - theme.space('space.4')),
      animated: !reduceMotion,
    });
  }, [activeId, reduceMotion, theme]);

  const isPill = variant === 'pill';

  return (
    <View
      style={[
        isPill
          ? { backgroundColor: 'transparent' }
          : {
              borderBottomWidth: 1,
              borderBottomColor: theme.color('color.border.default'),
              backgroundColor: theme.color('color.background.primary'),
            },
        style,
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        contentContainerStyle={{
          paddingHorizontal: theme.space(isPill ? 'space.4' : 'space.2'),
          gap: theme.space(isPill ? 'space.2' : 'space.1'),
          alignItems: 'center',
        }}
      >
        {items.map((item) => {
          const selected = item.id === activeId;
          const labelWithCount =
            item.count === undefined ? item.label : `${item.label} ${String(item.count)}`;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={labelWithCount}
              onLayout={(event) => {
                recordLayout(item.id, event);
              }}
              onPress={() => {
                onChange(item.id);
              }}
              style={
                isPill
                  ? {
                      minHeight: MIN_TOUCH_TARGET,
                      paddingHorizontal: theme.space('space.4'),
                      justifyContent: 'center',
                      borderRadius: theme.radius('radius.full'),
                      borderWidth: 1,
                      borderColor: selected
                        ? theme.color('color.accent.default')
                        : theme.color('color.border.default'),
                      backgroundColor: selected
                        ? theme.color('color.accent.default')
                        : 'transparent',
                    }
                  : {
                      minHeight: MIN_TOUCH_TARGET,
                      paddingHorizontal: theme.space('space.3'),
                      justifyContent: 'center',
                      borderBottomWidth: 2,
                      borderBottomColor: selected
                        ? theme.color('color.accent.default')
                        : 'transparent',
                    }
              }
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.1') }}
              >
                <Text
                  role="label"
                  color={
                    isPill && selected
                      ? 'color.accent.onAccent'
                      : selected
                        ? 'color.text.primary'
                        : 'color.text.secondary'
                  }
                >
                  {item.label}
                </Text>
                {item.count !== undefined ? (
                  <Text
                    role="meta"
                    color={isPill && selected ? 'color.accent.onAccent' : 'color.text.tertiary'}
                  >
                    {formatCount(item.count)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Compact count for tab chrome — four digits is already too wide on a phone. */
function formatCount(count: number): string {
  if (count < 1000) {
    return String(count);
  }
  if (count < 1_000_000) {
    const thousands = count / 1000;
    return `${thousands >= 10 ? String(Math.round(thousands)) : thousands.toFixed(1)}k`;
  }
  const millions = count / 1_000_000;
  return `${millions >= 10 ? String(Math.round(millions)) : millions.toFixed(1)}M`;
}
