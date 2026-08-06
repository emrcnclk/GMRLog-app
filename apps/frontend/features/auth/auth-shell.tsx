import { LogoMark, Screen, Text, useTheme } from '@gmrlog/ui';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTH_GUTTER, AUTH_MEASURE } from './auth-layout';

export interface AuthShellProps {
  /** The `display`-sized line. One sentence; it is the whole top zone. */
  headline: string;
  /** The paragraph under it, capped at a reading measure. */
  body: string;
  /** Sits between the body and the bottom zone — Register's step indicator. */
  topZoneFooter?: ReactNode;
  /** Provider stack, or the form that replaces it. */
  children: ReactNode;
}

/**
 * `SCREEN_REDESIGNS.md` §1 — the auth shell.
 *
 * A full-height flex column with two zones, no card and no centring: a top zone
 * that is mostly empty (that emptiness is the design) and a bottom zone the
 * caller fills. §2 requires Register to be "the same screen in another state" —
 * same logo position, same headline size, same button geometry — so the shell is
 * a component rather than a layout copied twice; if it were copied, the two
 * would drift and the flow would break, which is the failure §2 names.
 *
 * It is local to `features/auth` rather than a `@gmrlog/ui` primitive: it is a
 * composition of existing primitives for three screens in one feature, not a
 * design-system atom the rest of the app can use.
 */
export function AuthShell({ headline, body, topZoneFooter, children }: AuthShellProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            // §1's `0 26px 34px`, rounded onto the scale: `space.6` (24) and
            // `space.8` (32). No safe-area top padding — §1 is explicit that the
            // headline should sit high; the top zone's own centring keeps it off
            // the status bar on a real device.
            paddingHorizontal: theme.space(AUTH_GUTTER),
            paddingBottom: insets.bottom + theme.space('space.8'),
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingTop: theme.space('space.10'),
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space('space.3'),
                marginBottom: theme.space('space.12'),
              }}
            >
              <LogoMark size={18} glow />
              {/* Same role the Home header's wordmark landed on in 3.6 — the
                  exact weight over the exact size, so the two marks read as one
                  brand rather than two. */}
              <Text role="label">GMRLOG</Text>
            </View>

            {/* `display` is 40px / 300 / −1.5px tracking: §1's "40px weight 300
                with −0.038em" lands on it exactly, all three numbers. */}
            <Text role="display">{headline}</Text>

            <Text
              role="body"
              color="color.text.secondary"
              style={{ maxWidth: AUTH_MEASURE, marginTop: theme.space('space.5') }}
            >
              {body}
            </Text>

            {/* §3 puts the step rail "`space.9` below the body" — a step that
                does not exist; 0.1's correction picks `space.10` (40). The gap
                belongs to the shell rather than to either caller, so §2's
                Register and §3's Onboarding cannot drift apart on it. */}
            {topZoneFooter === undefined ? null : (
              <View style={{ marginTop: theme.space('space.10') }}>{topZoneFooter}</View>
            )}
          </View>

          <View style={{ gap: theme.space('space.2') }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
