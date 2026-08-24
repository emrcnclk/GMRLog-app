import { describe, expect, it } from 'vitest';

import { foldForSearch, searchCountries } from './country-search';

const names = (query: string): string[] => searchCountries(query).map((c) => c.name);

describe('searchCountries', () => {
  // Found by typing into the live registration form, not by reading the code:
  // "turkiye" returned "No country matches that." and "tur" listed Turks and
  // Caicos Islands and Turkmenistan without Türkiye.
  it('finds Türkiye from an ASCII keyboard', () => {
    expect(names('turkiye')).toContain('Türkiye');
    expect(names('turk')).toContain('Türkiye');
    expect(names('tur')).toContain('Türkiye');
  });

  it('still finds it when the diacritic is typed', () => {
    expect(names('türkiye')).toContain('Türkiye');
    expect(names('Türkiye')).toContain('Türkiye');
  });

  it('reaches every other accented name without its accent', () => {
    // The complete set of non-ASCII names in the list; each was unreachable
    // before folding.
    expect(names('aland')).toContain('Åland Islands');
    expect(names('barthelemy')).toContain('Saint Barthélemy');
    expect(names('curacao')).toContain('Curaçao');
    expect(names('reunion')).toContain('Réunion');
  });

  it('puts an exact country code first', () => {
    // "TR" is a substring of Austria, Australia, Central African Republic and
    // Eritrea, all of which used to rank above the country actually asked for.
    expect(names('TR')[0]).toBe('Türkiye');
    expect(names('tr')[0]).toBe('Türkiye');
  });

  it('ranks a name that starts with the query above one that merely contains it', () => {
    const results = names('ind');
    expect(results.indexOf('India')).toBeLessThan(
      results.indexOf('British Indian Ocean Territory'),
    );
  });

  it('returns nothing for an empty or whitespace query', () => {
    expect(searchCountries('')).toHaveLength(0);
    expect(searchCountries('   ')).toHaveLength(0);
  });

  it('still reports no match for a query that matches nothing', () => {
    expect(searchCountries('zzzzz')).toHaveLength(0);
  });
});

describe('foldForSearch', () => {
  it('is locale-independent', () => {
    // `toLocaleLowerCase` under a Turkish locale maps I to ı, which would
    // break matching on exactly the machines this matters most on.
    expect(foldForSearch('INDIA')).toBe('india');
    expect(foldForSearch('Ireland')).toBe('ireland');
  });
});
