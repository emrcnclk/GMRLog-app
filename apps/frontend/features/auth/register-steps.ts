import { sessionRegisterObjectSchema, type SessionRegisterInput } from '@gmrlog/validators';

/**
 * The fields a player actually types.
 *
 * Everything excluded here is excluded for the same reason: the field-props
 * map, the `Controller` loop and the per-step completeness check all assume a
 * plain text input, and none of these is one. 12.4's `shownLegalDocuments` is
 * an array of objects; 12.4a's `termsAccepted` is a checkbox; 12.4c's
 * `birthDate`, `countryCode` and `locale` are rendered by their own controls on
 * the profile step. `firstName` and `lastName` stay in — they are ordinary text
 * fields and go through the loop like the rest.
 */
export type RegisterField = Exclude<
  keyof SessionRegisterInput,
  'shownLegalDocuments' | 'termsAccepted' | 'birthDate' | 'countryCode' | 'locale'
>;

/** Everything a step can gate on, including the controls that are not text. */
export type RegisterGatedField = Exclude<
  keyof SessionRegisterInput,
  'shownLegalDocuments' | 'termsAccepted'
>;

export interface RegisterStep {
  /** Stable id — used as a key and in the spec, never rendered. */
  id: string;
  /**
   * The fields this step puts in the bottom zone, in render order.
   *
   * Text inputs only: this list drives the generic `TextField` loop.
   */
  fields: readonly RegisterField[];
  /**
   * 12.4c — everything the step's schema validates, which is a superset of
   * `fields` on the profile step.
   *
   * The two were the same list until the profile step arrived with three
   * controls that are not text inputs. Collapsing them again would mean either
   * rendering a country picker through the `TextField` loop or letting the
   * step's Continue button open without a birth date — the second is what
   * actually happened when this was one list, caught by the spec beside this
   * file.
   */
  gates: readonly RegisterGatedField[];
  /** The label on the step's own forward button. */
  action: string;
}

/**
 * `SCREEN_REDESIGNS.md` §2's progressive disclosure: "handle → email → password
 * as three steps sharing the top zone."
 *
 * **§2 names three steps; the schema has four fields.** `displayName` is
 * required by `sessionRegisterSchema` and Phase 3 is layout only — dropping it
 * or making it optional would be a validator change, not a recomposition. It
 * joins `handle` in the first step because they are the same question asked
 * twice (the name people read, the name the URL carries), which keeps §2's three
 * steps and leaves the last one a single password field before the submit.
 *
 * **12.4c makes it four steps, and that is a deliberate departure from §2.**
 * The doc was written before registration asked for a birth date, a country and
 * a language; §2's three steps describe a form that no longer exists. The
 * alternatives were both worse: folding five more controls into the identity
 * step would make the first thing a new player sees the longest, and dropping
 * the progressive disclosure entirely would discard the pattern §2 exists to
 * establish. The new step sits third — after the account is described, before
 * the password — because it is the least urgent group and the easiest to
 * abandon on, which is the right place for the questions a player is most
 * likely to hesitate over.
 *
 * Two of its five controls are optional (`firstName`, `lastName`), so the step
 * can be passed through untouched by anyone who does not want to give a real
 * name — which is the point of them being optional.
 *
 * Each step carries the slice of the shared schema that gates it, so the
 * disabled state of "Continue" is decided by `@gmrlog/validators` and not by a
 * second set of rules written here.
 */
export const REGISTER_STEPS: readonly RegisterStep[] = [
  {
    id: 'identity',
    fields: ['displayName', 'handle'],
    gates: ['displayName', 'handle'],
    action: 'Continue',
  },
  { id: 'email', fields: ['email'], gates: ['email'], action: 'Continue' },
  {
    id: 'profile',
    fields: ['firstName', 'lastName'],
    gates: ['firstName', 'lastName', 'birthDate', 'countryCode', 'locale'],
    action: 'Continue',
  },
  { id: 'password', fields: ['password'], gates: ['password'], action: 'Create account' },
] as const;

const STEP_SCHEMAS = [
  sessionRegisterObjectSchema.pick({ displayName: true, handle: true }),
  sessionRegisterObjectSchema.pick({ email: true }),
  // 12.4c — `birthDate`, `countryCode` and `locale` are gated here too, but
  // they are not in the step's `fields` list because that list drives the
  // generic `TextField` loop and none of the three is a text input. The screen
  // renders them itself; this schema is what decides whether Continue is live.
  sessionRegisterObjectSchema.pick({
    firstName: true,
    lastName: true,
    birthDate: true,
    countryCode: true,
    locale: true,
  }),
  sessionRegisterObjectSchema.pick({ password: true }),
] as const;

/**
 * Whether a step's own fields pass the shared schema — the gate on its forward
 * button. §2: "the submit stays disabled, as it does now", which on a stepped
 * form has to mean each step's button, not only the last.
 *
 * The picked schemas keep `.strict()`, so only the step's own keys are handed
 * over; a field from a later step being empty cannot hold an earlier step shut.
 */
export function isRegisterStepComplete(
  index: number,
  values: Partial<Record<RegisterGatedField, string>>,
): boolean {
  const step = REGISTER_STEPS[index];
  const schema = STEP_SCHEMAS[index];
  if (step === undefined || schema === undefined) return false;

  const subset: Record<string, string> = {};
  for (const field of step.gates) {
    subset[field] = values[field] ?? '';
  }

  return schema.safeParse(subset).success;
}

/**
 * 12.4 — whether the register screen's forward/submit button is disabled.
 *
 * Extracted from the screen so the two rules that are easy to get wrong are
 * testable without rendering.
 *
 * **The last step waits on the legal listing.** A player cannot agree to a
 * document the app has not loaded, and submitting without the versions would
 * either fail server-side or, worse, record agreement to something never shown.
 *
 * **The last step waits on the tick (12.4a).** The wire schema types
 * `termsAccepted` as `literal(true)`, so an unticked submission is refused
 * anyway — but a button that submits and then fails is a worse experience than
 * one that stays visibly disabled until the box is ticked.
 */
export function isRegisterSubmitDisabled(input: {
  busy: boolean;
  stepComplete: boolean;
  isLastStep: boolean;
  isFormValid: boolean;
  legalReady: boolean;
  termsAccepted: boolean;
}): boolean {
  if (input.busy || !input.stepComplete) {
    return true;
  }

  if (!input.isLastStep) {
    return false;
  }

  return !input.isFormValid || !input.legalReady || !input.termsAccepted;
}
