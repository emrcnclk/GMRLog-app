import { Button, Container, ErrorBanner, Screen, Text, TextField, useTheme } from '@gmrlog/ui';
import { sessionRegisterSchema, type SessionRegisterInput } from '@gmrlog/validators';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mapAuthError, type AuthUiError } from '../../src/auth/map-auth-error';
import { useAppForm } from '../../src/forms/use-app-form';
import { visibleFieldError } from '../../src/forms/visible-field-error';
import { useAuthStore } from '../../src/state/auth-store';
import { useConnectivityStore } from '../../src/state/stores';

/**
 * Production register — email · password · displayName · handle (S1 §14.2).
 */
export function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [banner, setBanner] = useState<AuthUiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useAppForm(sessionRegisterSchema, {
    defaultValues: { email: '', password: '', displayName: '', handle: '' },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitted, isSubmitting, touchedFields },
  } = form;

  const disabled = submitting || isSubmitting || !isValid;

  const onSubmit = handleSubmit(async (values: SessionRegisterInput) => {
    setBanner(null);
    setSubmitting(true);
    try {
      await register(values);
    } catch (error) {
      setBanner(mapAuthError(error, isOnline));
    } finally {
      setSubmitting(false);
    }
  });

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
            justifyContent: 'center',
            paddingTop: insets.top + theme.space('space.6'),
            paddingBottom: insets.bottom + theme.space('space.6'),
            paddingHorizontal: theme.space('space.4'),
          }}
        >
          <Container>
            <View style={{ gap: theme.space('space.6') }}>
              <View style={{ gap: theme.space('space.2') }}>
                <Text role="display">GMRLOG</Text>
                <Text role="body" color="color.text.secondary">
                  Create your digital home
                </Text>
              </View>

              {banner ? (
                <ErrorBanner title={banner.title} description={banner.description} />
              ) : null}

              <View style={{ gap: theme.space('space.4') }}>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Display name"
                      autoCapitalize="words"
                      autoComplete="name"
                      textContentType="name"
                      returnKeyType="next"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={visibleFieldError(
                        errors.displayName,
                        touchedFields.displayName,
                        isSubmitted,
                      )}
                      editable={!submitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="handle"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Handle"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="username"
                      textContentType="username"
                      returnKeyType="next"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={visibleFieldError(errors.handle, touchedFields.handle, isSubmitted)}
                      editable={!submitting}
                    />
                  )}
                />

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
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="done"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      onSubmitEditing={() => {
                        void onSubmit();
                      }}
                      error={visibleFieldError(
                        errors.password,
                        touchedFields.password,
                        isSubmitted,
                      )}
                      editable={!submitting}
                    />
                  )}
                />

                <Button
                  accessibilityLabel="Sign up"
                  loading={submitting || isSubmitting}
                  disabled={disabled}
                  onPress={() => {
                    void onSubmit();
                  }}
                >
                  Sign up
                </Button>

                <Button
                  variant="ghost"
                  accessibilityLabel="Sign in"
                  disabled={submitting || isSubmitting}
                  onPress={() => {
                    router.back();
                  }}
                >
                  Sign in
                </Button>
              </View>
            </View>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
