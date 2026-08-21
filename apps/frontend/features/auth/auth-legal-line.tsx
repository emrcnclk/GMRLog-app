import { Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { LEGAL_ROUTES } from '../legal/model/legal-model';

import { AUTH_TAP_TARGET } from './auth-layout';

/**
 * 12.3 — the auth legal line, finally with documents behind it.
 *
 * **Shared by Login and Register rather than written twice.** §2's stated
 * failure mode is the two auth screens drifting apart, and 3.11 already made
 * this call once for `AuthShell` and `auth-layout.ts`. One component, two call
 * sites, no chance of one screen linking and the other not.
 *
 * **Why the links sit on their own row instead of inline in the sentence.**
 * 3.10 rendered this as one plain sentence because there was nothing to link
 * to; the prototype's version puts two links inside the sentence. Inline links
 * cannot satisfy CLAUDE.md's ≥44px tap-target floor without either inflating
 * the line height of a 13px sentence or leaning on `hitSlop`, which RNW does
 * not carry to the DOM. Splitting the row keeps the sentence a sentence — in
 * `bodySm`, not monospace `meta`, per the ramp note 3.10 and 3.11 both recorded
 * — and gives each link a real target box.
 */
function AuthLegalLineComponent() {
  const theme = useTheme();
  const router = useRouter();

  const openTerms = useCallback(() => {
    router.push(LEGAL_ROUTES.terms);
  }, [router]);

  const openPrivacy = useCallback(() => {
    router.push(LEGAL_ROUTES.privacy);
  }, [router]);

  return (
    <View style={{ alignItems: 'center', marginTop: theme.space('space.2') }}>
      <Text role="bodySm" color="color.text.tertiary" style={{ textAlign: 'center' }}>
        By continuing you agree to
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Terms of Service"
          role="link"
          onPress={openTerms}
          style={{
            minHeight: AUTH_TAP_TARGET,
            justifyContent: 'center',
            paddingHorizontal: theme.space('space.2'),
          }}
        >
          <Text
            role="bodySm"
            color="color.text.secondary"
            style={{ textDecorationLine: 'underline' }}
          >
            Terms of Service
          </Text>
        </Pressable>

        {/* Decorative separator — a screen reader announcing "middle dot"
            between two links is noise. */}
        <Text role="bodySm" color="color.text.tertiary" aria-hidden accessible={false}>
          ·
        </Text>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
          role="link"
          onPress={openPrivacy}
          style={{
            minHeight: AUTH_TAP_TARGET,
            justifyContent: 'center',
            paddingHorizontal: theme.space('space.2'),
          }}
        >
          <Text
            role="bodySm"
            color="color.text.secondary"
            style={{ textDecorationLine: 'underline' }}
          >
            Privacy Policy
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const AuthLegalLine = memo(AuthLegalLineComponent);
