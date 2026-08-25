import { Icon, Text, useTheme } from '@gmrlog/ui';
import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AUTH_TAP_TARGET } from './auth-layout';

export interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Announced to assistive tech. The visible label may contain links. */
  accessibilityLabel: string;
  children: ReactNode;
}

/**
 * 12.4a — the "I have read and accept" control.
 *
 * **Why this is not `Toggle`, and not a new `@gmrlog/ui` primitive.** `Toggle`
 * is a settings switch: it states a preference that takes effect immediately
 * and can be flipped back at no cost. A consent tick is a different gesture —
 * it is an assertion about something the player has read, made once, at a
 * moment that gets recorded. Reusing the switch would say the wrong thing about
 * what the gesture means. It is also not promoted to `@gmrlog/ui` because it
 * has exactly one call site; if a second appears — the re-consent surface is
 * the obvious candidate — that is the moment to move it, with a reason.
 *
 * **The accent rule.** A checked box draws an accent *border* and an accent
 * glyph, never an accent fill. The design law allows a flood only on a primary
 * CTA, and this is not one. In the `neutral` accent the box still reads as
 * checked because the mark is geometry, not colour.
 */
function ConsentCheckboxComponent({
  checked,
  onChange,
  accessibilityLabel,
  children,
}: ConsentCheckboxProps) {
  const theme = useTheme();
  const box = theme.space('space.5');

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      // RNW drops `accessibilityState` before the DOM — CLAUDE.md's standing
      // rule is to add the modern `aria-*` prop alongside it rather than fold
      // the state into the label.
      role="checkbox"
      aria-checked={checked}
      onPress={() => {
        onChange(!checked);
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.space('space.3'),
        minHeight: AUTH_TAP_TARGET,
        paddingVertical: theme.space('space.2'),
      }}
    >
      <View
        style={{
          width: box,
          height: box,
          borderRadius: theme.radius('radius.sm'),
          borderWidth: 1,
          // Follows `Toggle`'s precedent — accent when on, `border.default`
          // when off — rather than inventing a `border.strong` token that does
          // not exist. Worth a look in the live visual pass: `border.default`
          // is a deliberate whisper, and a 20px box may carry it less well than
          // Toggle's much larger track does.
          borderColor: checked
            ? theme.color('color.accent.default')
            : theme.color('color.border.default'),
          alignItems: 'center',
          justifyContent: 'center',
          // Nudged down so the box aligns with the first line of the label
          // rather than with the top of its line box.
          marginTop: theme.space('space.1'),
        }}
      >
        {checked ? <Icon name="check" size={14} color="color.accent.default" decorative /> : null}
      </View>

      <Text role="bodySm" color="color.text.secondary" style={{ flex: 1 }}>
        {children}
      </Text>
    </Pressable>
  );
}

export const ConsentCheckbox = memo(ConsentCheckboxComponent);
