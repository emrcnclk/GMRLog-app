import { COUNTRY_CODES } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  ageInYears,
  birthDateSchema,
  countryCodeSchema,
  localeSchema,
  MINIMUM_AGE_YEARS,
  optionalPersonNameSchema,
  sessionRegisterSchema,
} from './index';

/** A birth date exactly `years` before today, to the day. */
function birthDateForAge(years: number, dayOffset = 0): string {
  const today = new Date();
  const date = new Date(
    Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate() + dayOffset),
  );
  return date.toISOString().slice(0, 10);
}

describe('ageInYears', () => {
  it('counts whole years', () => {
    expect(ageInYears(new Date('1990-06-15T00:00:00Z'), new Date('2026-06-15T00:00:00Z'))).toBe(36);
  });

  it('does not count a birthday that has not happened yet this year', () => {
    // The off-by-one that makes an age gate let a 12-year-old through.
    expect(ageInYears(new Date('1990-06-15T00:00:00Z'), new Date('2026-06-14T00:00:00Z'))).toBe(35);
  });

  it('counts the birthday itself', () => {
    expect(ageInYears(new Date('2013-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'))).toBe(13);
  });
});

describe('birthDateSchema', () => {
  it('accepts a date comfortably past the floor', () => {
    expect(birthDateSchema.safeParse('1995-06-15').success).toBe(true);
  });

  it('accepts someone who turns 13 today', () => {
    expect(birthDateSchema.safeParse(birthDateForAge(MINIMUM_AGE_YEARS)).success).toBe(true);
  });

  it('rejects someone one day short of 13', () => {
    // The Terms of Service have claimed this floor since 12.1 and nothing
    // enforced it until this schema existed.
    expect(birthDateSchema.safeParse(birthDateForAge(MINIMUM_AGE_YEARS, 1)).success).toBe(false);
  });

  it.each(['15-06-1995', '1995/06/15', '1995-6-15', '', 'yesterday'])(
    'rejects the malformed date %o',
    (value: string) => {
      expect(birthDateSchema.safeParse(value).success).toBe(false);
    },
  );

  it('rejects a date that looks well-formed but is not a real day', () => {
    // `Date.parse` rolls 2 February 30th over into March rather than failing.
    expect(birthDateSchema.safeParse('2005-02-30').success).toBe(false);
  });

  it('rejects a future date', () => {
    expect(birthDateSchema.safeParse('2999-01-01').success).toBe(false);
  });

  it('rejects an implausibly distant year, which is what a mistyped one looks like', () => {
    expect(birthDateSchema.safeParse('0995-06-15').success).toBe(false);
  });
});

describe('countryCodeSchema', () => {
  it('accepts a real code', () => {
    expect(countryCodeSchema.safeParse('TR').success).toBe(true);
  });

  it('uppercases a lowercase code', () => {
    const parsed = countryCodeSchema.safeParse('de');
    expect(parsed.success && parsed.data).toBe('DE');
  });

  it('rejects a well-shaped code that is not a country', () => {
    // `XX` passes a bare two-letter pattern. This value decides which consumer
    // law and which minimum age apply, so the shape is not enough.
    expect(countryCodeSchema.safeParse('XX').success).toBe(false);
  });

  it('rejects the wrong length', () => {
    expect(countryCodeSchema.safeParse('TUR').success).toBe(false);
    expect(countryCodeSchema.safeParse('T').success).toBe(false);
  });

  it('covers the countries the picker offers', () => {
    for (const code of COUNTRY_CODES) {
      expect(countryCodeSchema.safeParse(code).success, code).toBe(true);
    }
  });
});

describe('localeSchema', () => {
  it('accepts the languages the product actually has content in', () => {
    expect(localeSchema.safeParse('en').success).toBe(true);
    expect(localeSchema.safeParse('tr').success).toBe(true);
  });

  it('rejects a language the app has nothing in', () => {
    // A picker offering a third language would be a promise the app cannot
    // keep — and the legal texts are the content that matters most.
    expect(localeSchema.safeParse('de').success).toBe(false);
  });
});

describe('optionalPersonNameSchema', () => {
  it('accepts a name', () => {
    const parsed = optionalPersonNameSchema.safeParse('  Ada  ');
    expect(parsed.success && parsed.data).toBe('Ada');
  });

  it('normalises an empty submission to undefined rather than an empty string', () => {
    // A stored "" reads as "a name we have". It is not.
    const parsed = optionalPersonNameSchema.safeParse('   ');
    expect(parsed.success && parsed.data).toBeUndefined();
  });

  it('accepts being left out entirely', () => {
    expect(optionalPersonNameSchema.safeParse(undefined).success).toBe(true);
  });
});

describe('sessionRegisterSchema — the language/document invariant', () => {
  const base = {
    email: 'player@example.test',
    password: 'secure-password-12',
    displayName: 'New Player',
    handle: 'new_player',
    birthDate: '1995-06-15',
    countryCode: 'TR',
    termsAccepted: true as const,
  };

  it('accepts a submission whose documents match the chosen language', () => {
    const parsed = sessionRegisterSchema.safeParse({
      ...base,
      locale: 'tr',
      shownLegalDocuments: [{ documentId: 'terms-of-service', version: '1.0.0', locale: 'tr' }],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a Turkish sign-up that read the English terms', () => {
    // Without this the record would say "Turkish" while its consent row says
    // the English text was displayed — describing a screen nobody saw.
    const parsed = sessionRegisterSchema.safeParse({
      ...base,
      locale: 'tr',
      shownLegalDocuments: [{ documentId: 'terms-of-service', version: '1.0.0', locale: 'en' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an unticked registration outright', () => {
    const parsed = sessionRegisterSchema.safeParse({
      ...base,
      termsAccepted: false,
      locale: 'en',
      shownLegalDocuments: [{ documentId: 'terms-of-service', version: '1.0.0', locale: 'en' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a registration from someone under 13', () => {
    const parsed = sessionRegisterSchema.safeParse({
      ...base,
      birthDate: birthDateForAge(MINIMUM_AGE_YEARS, 1),
      locale: 'en',
      shownLegalDocuments: [{ documentId: 'terms-of-service', version: '1.0.0', locale: 'en' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a registration with no real name given', () => {
    const parsed = sessionRegisterSchema.safeParse({
      ...base,
      locale: 'en',
      shownLegalDocuments: [{ documentId: 'terms-of-service', version: '1.0.0', locale: 'en' }],
    });
    expect(parsed.success).toBe(true);
  });
});
