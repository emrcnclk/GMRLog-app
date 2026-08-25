import { Button, ErrorBanner, TextField, useTheme } from '@gmrlog/ui';
import { sessionCreateSchema, type SessionCreateInput } from '@gmrlog/validators';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { mapAuthError, type AuthUiError } from '../../src/auth/map-auth-error';
import { useAppForm } from '../../src/forms/use-app-form';
import { visibleFieldError } from '../../src/forms/visible-field-error';
import { useAuthStore } from '../../src/state/auth-store';
import { useConnectivityStore } from '../../src/state/stores';

import { AUTH_BUTTON_HEIGHT } from './auth-layout';
import { AuthLegalLine } from './auth-legal-line';
import { AuthShell } from './auth-shell';
import { useOAuthSignIn } from './hooks/use-oauth-sign-in';
import { OauthProviderButtons, type AuthOauthProvider } from './oauth-provider-buttons';

/**
 * `SCREEN_REDESIGNS.md` §1 — Login.
 *
 * Layout only. `useAppForm`, `sessionCreateSchema`, `mapAuthError` and
 * `ErrorBanner` are exactly what they were; what changed is where they sit.
 *
 * §1's two states: the bottom zone opens as a stack of provider buttons, and
 * "Continue with email" swaps it for the two fields and a submit **without
 * touching the top zone** — the headline does not move, which is the whole point
 * of making it a mode rather than a second route.
 */
export function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const sessionEndedNotice = useAuthStore((s) => s.sessionEndedNotice);
  const clearSessionEndedNotice = useAuthStore((s) => s.clearSessionEndedNotice);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [banner, setBanner] = useState<AuthUiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'providers' | 'email'>('providers');

  // 12.6 — a session the player did not end, ended for a reason they need to
  // read: an account whose deletion grace period lapsed fails on refresh, in
  // the background, and lands them here. Consumed once and cleared, so it
  // cannot reappear over a later, unrelated sign-in attempt. It goes into the
  // same `banner` the form uses rather than a second surface — §1 gives this
  // screen exactly one place for a message.
  useEffect(() => {
    if (sessionEndedNotice !== null) {
      setBanner(sessionEndedNotice);
      clearSessionEndedNotice();
    }
  }, [sessionEndedNotice, clearSessionEndedNotice]);

  const form = useAppForm(sessionCreateSchema, {
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitted, isSubmitting, touchedFields },
  } = form;

  const busy = submitting || isSubmitting;
  const disabled = busy || !isValid;

  const onSubmit = handleSubmit(async (values: SessionCreateInput) => {
    setBanner(null);
    setSubmitting(true);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setBanner(mapAuthError(error, isOnline));
    } finally {
      setSubmitting(false);
    }
  });

  const { signIn: signInWithOAuth, pending: oauthPending } = useOAuthSignIn();

  const onOauthSelect = async (provider: AuthOauthProvider) => {
    setBanner(null);
    const result = await signInWithOAuth(provider);
    switch (result.status) {
      case 'success':
      case 'cancelled':
        // Cancelled is not a failure (OAUTH.md §4) — return silently to the screen.
        return;
      case 'unavailable': {
        const label =
          result.provider === 'discord'
            ? 'Discord'
            : result.provider === 'steam'
              ? 'Steam'
              : 'this provider';
        setBanner({
          kind: 'unavailable',
          title: `Continue with ${label}`,
          description: 'Provider sign-in is not available yet. Use email or create an account.',
        });
        return;
      }
      case 'error':
        setBanner(mapAuthError(result.error, isOnline));
    }
  };

  return (
    <AuthShell
      headline="Sign into your digital home."
      body="Log what you play, and the record answers one question: what kind of gamer are you?"
    >
      {/* §1: "The banner mounts above the bottom zone." */}
      {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}

      {mode === 'providers' ? (
        <>
          {/* The accent border goes on the one path that can actually sign a
              player in today — the three OAuth flows are Phase 4 and still
              answer with the "not available yet" banner. Pointing the accent at
              a dead end would be the accent carrying a meaning it should not. */}
          <Button
            variant="accent"
            accessibilityLabel="Continue with email"
            icon={<Mail size={18} color={theme.color('color.accent.default')} strokeWidth={1.75} />}
            style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
            onPress={() => {
              setMode('email');
            }}
          >
            Continue with email
          </Button>

          <OauthProviderButtons
            disabled={busy || oauthPending}
            onSelect={(provider) => {
              void onOauthSelect(provider);
            }}
          />
        </>
      ) : (
        <View style={{ gap: theme.space('space.3') }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={visibleFieldError(errors.email, touchedFields.email, isSubmitted)}
                editable={!submitting}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                onSubmitEditing={() => {
                  void onSubmit();
                }}
                error={visibleFieldError(errors.password, touchedFields.password, isSubmitted)}
                editable={!submitting}
              />
            )}
          />

          <Button
            variant="accent"
            accessibilityLabel="Sign in"
            loading={busy}
            disabled={disabled}
            style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
            onPress={() => {
              void onSubmit();
            }}
          >
            Sign in
          </Button>

          <Button
            variant="ghost"
            accessibilityLabel="Back to sign-in options"
            disabled={busy}
            icon={
              <ArrowLeft size={18} color={theme.color('color.text.primary')} strokeWidth={1.75} />
            }
            style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
            onPress={() => {
              setBanner(null);
              setMode('providers');
            }}
          >
            Other ways in
          </Button>
        </View>
      )}

      {/* Not named in §1, kept because `/(auth)/register` is a real screen with
          a real route and nothing else on this screen reaches it. Text-weight so
          it does not join the button stack as a fifth peer. */}
      <Button
        variant="ghost"
        accessibilityLabel="Sign up"
        disabled={busy}
        style={{ borderWidth: 0 }}
        onPress={() => {
          router.push('/(auth)/register');
        }}
      >
        Create an account
      </Button>

      <AuthLegalLine />
    </AuthShell>
  );
}
