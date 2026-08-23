import { asLegalLocale, DEFAULT_LEGAL_LOCALE } from '@gmrlog/types';
import { Button, ErrorBanner, SegmentedTabs, Text, TextField, useTheme } from '@gmrlog/ui';
import { sessionRegisterObjectSchema } from '@gmrlog/validators';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState, type ComponentProps } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { mapAuthError, type AuthUiError } from '../../src/auth/map-auth-error';
import { useAppForm } from '../../src/forms/use-app-form';
import { visibleFieldError } from '../../src/forms/visible-field-error';
import { useAuthStore } from '../../src/state/auth-store';
import { useConnectivityStore } from '../../src/state/stores';
import { useLegalDocuments } from '../legal/hooks/use-legal-documents';

import { AUTH_BUTTON_HEIGHT } from './auth-layout';
import { AuthLegalLine } from './auth-legal-line';
import { AuthShell } from './auth-shell';
import { AuthStepIndicator } from './auth-step-indicator';
import { CountryPicker } from './country-picker';
import {
  isRegisterStepComplete,
  isRegisterSubmitDisabled,
  REGISTER_STEPS,
  type RegisterField,
} from './register-steps';

/**
 * The per-field input configuration, unchanged from the single-page form — the
 * autofill contract is the part of a register screen that must not be
 * recomposed. Split out so the step loop stays a loop.
 */
const FIELD_PROPS: Record<RegisterField, ComponentProps<typeof TextField>> = {
  firstName: {
    // 12.4c — optional, and the label says so. A field that looks required and
    // is not is the kind of small dishonesty that makes people give data they
    // did not have to.
    label: 'First name (optional)',
    autoCapitalize: 'words',
    autoComplete: 'given-name',
    textContentType: 'givenName',
    returnKeyType: 'next',
  },
  lastName: {
    label: 'Last name (optional)',
    autoCapitalize: 'words',
    autoComplete: 'family-name',
    textContentType: 'familyName',
    returnKeyType: 'next',
  },
  displayName: {
    label: 'Display name',
    autoCapitalize: 'words',
    autoComplete: 'name',
    textContentType: 'name',
    returnKeyType: 'next',
  },
  handle: {
    label: 'Handle',
    autoCapitalize: 'none',
    autoCorrect: false,
    autoComplete: 'username',
    textContentType: 'username',
    returnKeyType: 'next',
  },
  email: {
    label: 'Email',
    autoCapitalize: 'none',
    autoComplete: 'email',
    autoCorrect: false,
    keyboardType: 'email-address',
    textContentType: 'emailAddress',
    returnKeyType: 'next',
  },
  password: {
    label: 'Password',
    secureTextEntry: true,
    autoCapitalize: 'none',
    autoComplete: 'new-password',
    textContentType: 'newPassword',
    returnKeyType: 'done',
  },
};

/**
 * `SCREEN_REDESIGNS.md` §2 — Register.
 *
 * "Same shell as Login, different headline and a three-field bottom zone. The
 * two screens must look like one screen in two states." That is why nothing
 * here draws a column: `AuthShell` and the three constants in `auth-layout.ts`
 * are imported, not re-derived. §2's own failure mode is this screen growing a
 * card or a second headline size.
 *
 * Layout only, as everywhere in Phase 3: `useAppForm`, `sessionRegisterSchema`,
 * `mapAuthError`, `ErrorBanner` and `useAuthStore().register` are exactly what
 * they were. What changed is that the four fields arrive in three steps instead
 * of all at once.
 */
/**
 * 12.4 / 12.4a — the schema the form validates: the wire schema minus the two
 * fields the player does not type. The record of what was displayed is merged
 * in at submit; the tick lives in its own state beside the submit button.
 */
/**
 * 12.4c — the two languages the product actually has content in. Offering a
 * third would be a promise the app cannot keep, and the legal texts are the
 * content that matters most: choosing a language here decides which translation
 * of the Terms is presented for acceptance.
 */
const REGISTER_LOCALES = [
  { id: 'en' as const, label: 'English' },
  { id: 'tr' as const, label: 'Türkçe' },
];

const REGISTER_FORM_SCHEMA = sessionRegisterObjectSchema.omit({
  shownLegalDocuments: true,
  termsAccepted: true,
});

type RegisterFormInput = import('zod').infer<typeof REGISTER_FORM_SCHEMA>;

export function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [banner, setBanner] = useState<AuthUiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // 12.4a — the tick. Local state rather than a form field: it is not one of
  // the four values the player types, and the step machinery assumes strings.
  const [termsAccepted, setTermsAccepted] = useState(false);

  // The form validates the four fields the player types. `acceptedLegalDocuments`
  // is deliberately omitted: it is not something anyone enters, it is a record of
  // what the app displayed, and putting an array of objects into a form whose
  // step machinery iterates string field names breaks that machinery outright —
  // which typecheck said plainly on the first attempt. It is merged in at submit,
  // and the submit is gated on it separately below.
  const form = useAppForm(REGISTER_FORM_SCHEMA, {
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      handle: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      // 12.4c — no default country. Pre-selecting one would make an
      // unconsidered choice look like the player's own, and this value decides
      // which consumer law and which minimum age apply to them.
      countryCode: '',
      // A default language is different: the app has to render in *something*
      // before the question is asked, and English is what it already renders
      // in. The picker starts on the truth rather than on blank.
      locale: 'en',
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitted, isSubmitting, touchedFields },
  } = form;

  const values = useWatch({ control });
  const busy = submitting || isSubmitting;

  // 12.4 — the versions actually in front of the player, fetched from the
  // public `/legal` listing rather than made up client-side.
  //
  // 12.4c — in the language the player just picked, not always English. The
  // listing is what `shownLegalDocuments` submits, and each entry carries its
  // own `locale` straight into `UserConsent.locale`; leaving it on the
  // fallback would record a Turkish registrant as having agreed to the
  // English wording they were never shown. Fetched below `values` rather than
  // above the form for that reason — it now depends on a field.
  const legal = useLegalDocuments(asLegalLocale(values.locale) ?? DEFAULT_LEGAL_LOCALE);

  const step = REGISTER_STEPS[stepIndex];
  const isLastStep = stepIndex === REGISTER_STEPS.length - 1;
  // Each step's own fields gate its forward button; the last one also waits on
  // the whole schema, which is §2's "the submit stays disabled, as it does now".
  const stepComplete = isRegisterStepComplete(stepIndex, values);
  // A player cannot agree to a document the app has not loaded, so the last
  // step waits on the legal listing as well as on the form. The rule itself
  // lives in `register-steps` so it can be tested without rendering.
  const disabled = isRegisterSubmitDisabled({
    busy,
    stepComplete,
    isLastStep,
    isFormValid: isValid,
    legalReady: legal.shown.length > 0,
    termsAccepted,
  });

  const onSubmit = handleSubmit(async (input: RegisterFormInput) => {
    setBanner(null);
    setSubmitting(true);
    try {
      // 12.4 — the versions actually shown, sent so the server can refuse a
      // stale submission rather than record agreement to a document the player
      // never saw. 12.4a — the tick travels separately, because only the Terms
      // are accepted; the notices are acknowledged, and the server decides
      // which is which from the document itself.
      // The tick itself, not a literal standing in for it. `isRegisterSubmitDisabled`
      // does gate the button on this state today, but that coupling lives in a
      // different file from the call site: a hardcoded `true` here submits an
      // acceptance regardless of the box the moment that gating changes, which
      // is precisely the false consent record `literal(true)` on the wire
      // schema exists to make impossible. The guard both narrows the type back
      // to `true` and makes the impossible case fail rather than lie.
      if (!termsAccepted) {
        setBanner({
          kind: 'validation',
          title: 'Terms not accepted',
          description: 'Tick the box to confirm you accept the Terms of Service.',
        });
        return;
      }

      await register({
        ...input,
        shownLegalDocuments: legal.shown,
        termsAccepted,
      });
    } catch (error) {
      setBanner(mapAuthError(error, isOnline));
    } finally {
      setSubmitting(false);
    }
  });

  const onForward = () => {
    if (isLastStep) {
      void onSubmit();
      return;
    }
    setBanner(null);
    setStepIndex((current) => current + 1);
  };

  if (step === undefined) return null;

  return (
    <AuthShell
      headline="Create your digital home."
      body="A handle, an email, a password. Three steps, and the record starts."
      topZoneFooter={<AuthStepIndicator count={REGISTER_STEPS.length} activeIndex={stepIndex} />}
    >
      {/* Same position §1 gives it on Login: above the bottom zone. */}
      {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}

      <View style={{ gap: theme.space('space.3') }}>
        {step.fields.map((field) => (
          <Controller
            key={field}
            control={control}
            name={field}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                {...FIELD_PROPS[field]}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                onSubmitEditing={onForward}
                error={visibleFieldError(errors[field], touchedFields[field], isSubmitted)}
                editable={!submitting}
              />
            )}
          />
        ))}

        {/* 12.4c — the profile step's three non-text controls. They are not in
            `step.fields` because that list drives the generic `TextField` loop
            above and none of these is a text input; they are still gated by the
            same picked schema, so Continue stays disabled until they are valid. */}
        {step.id === 'profile' ? (
          <View style={{ gap: theme.space('space.4') }}>
            <Controller
              control={control}
              name="birthDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Date of birth"
                  placeholder="YYYY-MM-DD"
                  // A text field rather than a native date picker: RN ships no
                  // cross-platform one, and adding a library for it would mean
                  // a web-only fork, which CLAUDE.md forbids. The format is
                  // stated, the validator is strict, and the error says what is
                  // wrong.
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={visibleFieldError(errors.birthDate, touchedFields.birthDate, isSubmitted)}
                  editable={!submitting}
                />
              )}
            />

            <Controller
              control={control}
              name="countryCode"
              render={({ field: { onChange, value } }) => (
                <CountryPicker
                  label="Country"
                  hint="Sets which consumer law and which minimum age apply to you."
                  // Empty string is "not chosen yet"; the picker takes null.
                  value={value.length === 0 ? null : value}
                  onChange={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="locale"
              render={({ field: { onChange, value } }) => (
                <View style={{ gap: theme.space('space.2') }}>
                  <Text role="label" color="color.text.secondary">
                    Language
                  </Text>
                  <SegmentedTabs
                    items={REGISTER_LOCALES}
                    activeId={value}
                    onChange={onChange}
                    variant="pill"
                    accessibilityLabel="Language"
                  />
                  {/* Stated plainly: the choice decides which translation of
                      the Terms the player is asked to accept, and the register
                      body refuses a mismatch between the two. */}
                  <Text role="bodySm" color="color.text.tertiary">
                    Also the language of the Terms you accept.
                  </Text>
                </View>
              )}
            />
          </View>
        ) : null}

        <Button
          variant="accent"
          accessibilityLabel={step.action}
          loading={isLastStep && busy}
          disabled={disabled}
          style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
          onPress={onForward}
        >
          {step.action}
        </Button>

        {/* §2 does not describe the way back through the steps, and Login's own
            "Other ways in" set the precedent: a one-way door into a form is a
            trap. Step one's way back is "Sign in" below, so it draws nothing. */}
        {stepIndex > 0 ? (
          <Button
            variant="ghost"
            accessibilityLabel="Back a step"
            disabled={busy}
            icon={
              <ArrowLeft size={18} color={theme.color('color.text.primary')} strokeWidth={1.75} />
            }
            style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
            onPress={() => {
              setBanner(null);
              setStepIndex((current) => current - 1);
            }}
          >
            Back
          </Button>
        ) : null}
      </View>

      {/* The mirror of Login's "Create an account", down to the borderless
          treatment, so neither screen strands anyone on the other's route. */}
      <Button
        variant="ghost"
        accessibilityLabel="Sign in"
        disabled={busy}
        style={{ borderWidth: 0 }}
        onPress={() => {
          router.back();
        }}
      >
        Already have an account
      </Button>

      {/* Not named in §2, carried from §1: Login renders it, and the screen that
          actually creates the account is the one where the sentence means
          something. 12.3 gave both routes real documents, so the two words are
          links now — the follow-up 3.10 raised and 3.11 re-raised is closed. */}
      <AuthLegalLine termsAccepted={termsAccepted} onTermsAcceptedChange={setTermsAccepted} />
    </AuthShell>
  );
}
