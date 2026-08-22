import { Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { LEGAL_ROUTES } from '../legal/model/legal-model';

import { AUTH_TAP_TARGET } from './auth-layout';
import { ConsentCheckbox } from './consent-checkbox';

export interface AuthLegalLineProps {
  /**
   * 12.4a — sign-up only. When present, the Terms carry a real tick and the
   * privacy notice is presented as something read, not agreed to.
   *
   * Sign-in passes neither: no account is created, so there is nothing to
   * accept and asking would be theatre.
   */
  termsAccepted?: boolean;
  onTermsAcceptedChange?: (next: boolean) => void;
}

/**
 * 12.3 / 12.4a — the auth legal line, with documents behind it and, on sign-up,
 * a real affirmative act.
 *
 * **Shared by Login and Register rather than written twice.** §2's stated
 * failure mode is the two auth screens drifting apart, and 3.11 already made
 * this call once for `AuthShell` and `auth-layout.ts`.
 *
 * **Why the links sit on their own row instead of inline in the sentence.**
 * Inline links cannot satisfy CLAUDE.md's ≥44px tap-target floor without either
 * inflating the line height of a 13px sentence or leaning on `hitSlop`, which
 * RNW does not carry to the DOM. The sentence stays a sentence — in `bodySm`,
 * not monospace `meta`, per the ramp note 3.10 and 3.11 both recorded.
 *
 * **Why only the Terms get a tick (12.4a).** The Terms are a contract, so they
 * are accepted. The Privacy Policy and the Aydınlatma Metni are notices: GDPR
 * Art. 13/14 and KVKK Art. 10 require that they be *given*, and the reader is
 * informed rather than asked. A tick on a privacy notice would blur the line
 * between being informed and consenting, and would manufacture a consent for
 * processing that does not rest on consent.
 */
function AuthLegalLineComponent({ termsAccepted, onTermsAcceptedChange }: AuthLegalLineProps) {
  const theme = useTheme();
  const router = useRouter();

  const openTerms = useCallback(() => {
    router.push(LEGAL_ROUTES.terms);
  }, [router]);

  const openPrivacy = useCallback(() => {
    router.push(LEGAL_ROUTES.privacy);
  }, [router]);

  const linkStyle = {
    minHeight: AUTH_TAP_TARGET,
    justifyContent: 'center' as const,
    paddingHorizontal: theme.space('space.2'),
  };

  const termsLink = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Read the Terms of Service"
      role="link"
      onPress={openTerms}
      style={linkStyle}
    >
      <Text role="bodySm" color="color.text.secondary" style={{ textDecorationLine: 'underline' }}>
        Terms of Service
      </Text>
    </Pressable>
  );

  const privacyLink = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Read the Privacy Policy"
      role="link"
      onPress={openPrivacy}
      style={linkStyle}
    >
      <Text role="bodySm" color="color.text.secondary" style={{ textDecorationLine: 'underline' }}>
        Privacy Policy
      </Text>
    </Pressable>
  );

  // Sign-in: no account is created, so there is nothing to accept.
  if (onTermsAcceptedChange === undefined) {
    return (
      <View style={{ alignItems: 'center', marginTop: theme.space('space.2') }}>
        <Text role="bodySm" color="color.text.tertiary" style={{ textAlign: 'center' }}>
          By continuing you agree to
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {termsLink}
          {/* Decorative separator — a screen reader announcing "middle dot"
              between two links is noise. */}
          <Text role="bodySm" color="color.text.tertiary" aria-hidden accessible={false}>
            ·
          </Text>
          {privacyLink}
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginTop: theme.space('space.2'), gap: theme.space('space.1') }}>
      <ConsentCheckbox
        checked={termsAccepted === true}
        onChange={onTermsAcceptedChange}
        accessibilityLabel="I have read and accept the Terms of Service"
      >
        I have read and accept the Terms of Service
      </ConsentCheckbox>

      {/* Read, not agreed to. Phrased as a statement of what happens rather
          than a request, because that is what a disclosure is. */}
      <Text role="bodySm" color="color.text.tertiary">
        We handle your data as described in the Privacy Policy.
      </Text>

      {/* Both documents stay reachable from here. A tick that says "I have
          read" beside no way to read is the failure this row prevents — and it
          is the one the first draft of this component shipped. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
        {termsLink}
        <Text role="bodySm" color="color.text.tertiary" aria-hidden accessible={false}>
          ·
        </Text>
        {privacyLink}
      </View>
    </View>
  );
}

export const AuthLegalLine = memo(AuthLegalLineComponent);
