import { COUNTRIES, type CountryOption } from '@gmrlog/types';

/**
 * Strip diacritics and case so a country is findable from an ASCII keyboard.
 *
 * Five of the 248 names carry non-ASCII characters — Åland Islands, Saint
 * Barthélemy, Curaçao, Réunion and **Türkiye** — and a plain
 * `name.toLowerCase().includes(needle)` made every one of them unreachable
 * unless the player produced the accented character themselves. Measured on
 * the live registration form: "turkiye" returned "No country matches that.",
 * and "tur" returned Turks and Caicos Islands and Turkmenistan without
 * Türkiye. In a product whose legal framework is KVKK-first that is not a
 * rough edge, it is the most likely country in the list being unfindable the
 * way most people type it.
 *
 * `toLowerCase`, never `toLocaleLowerCase`: under a Turkish locale the latter
 * maps `I` to `ı`, so a locale-aware lowercase would silently break matching
 * on exactly the machines this matters most on.
 */
export function foldForSearch(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Countries matching `query`, most relevant first.
 *
 * Ranking exists because the old filter had none: typing the code `TR`
 * returned Austria, Australia, Central African Republic and Eritrea — all of
 * which contain "tr" in their names — before Türkiye. An exact code match is
 * the least ambiguous thing a player can type, so it leads; a name that
 * starts with what was typed comes next; a name that merely contains it last.
 */
export function searchCountries(query: string): readonly CountryOption[] {
  const needle = foldForSearch(query.trim());
  if (needle.length === 0) {
    return [];
  }

  const exactCode: CountryOption[] = [];
  const prefix: CountryOption[] = [];
  const contains: CountryOption[] = [];

  for (const country of COUNTRIES) {
    const name = foldForSearch(country.name);
    if (country.code.toLowerCase() === needle) {
      exactCode.push(country);
    } else if (name.startsWith(needle)) {
      prefix.push(country);
    } else if (name.includes(needle)) {
      contains.push(country);
    }
  }

  return [...exactCode, ...prefix, ...contains];
}
