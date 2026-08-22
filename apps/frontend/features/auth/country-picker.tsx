import { COUNTRIES } from '@gmrlog/types';
import { ListItem, SearchField, Text, useTheme } from '@gmrlog/ui';
import { memo, useMemo, useState } from 'react';
import { View } from 'react-native';

/**
 * How many matches to render at once.
 *
 * 249 rows inside an already-scrolling auth screen is a nested scroll, which is
 * awkward on both platforms and actively bad on web. Showing a bounded set and
 * asking the player to narrow the search keeps the page a single scroll, and a
 * count line tells them when there is more rather than silently truncating.
 */
const VISIBLE_MATCHES = 6;

export interface CountryPickerProps {
  /** ISO 3166-1 alpha-2, or `null` when nothing is chosen yet. */
  value: string | null;
  onChange: (code: string) => void;
  label: string;
  /** Why the field is being asked for. Shown under the label. */
  hint?: string;
}

function CountryPickerComponent({ value, onChange, label, hint }: CountryPickerProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => COUNTRIES.find((country) => country.code === value) ?? null,
    [value],
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (needle.length === 0) {
      return [];
    }

    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) || country.code.toLowerCase() === needle,
    );
  }, [query]);

  return (
    <View style={{ gap: theme.space('space.2') }}>
      <Text role="label" color="color.text.secondary">
        {label}
      </Text>

      {hint === undefined ? null : (
        <Text role="bodySm" color="color.text.tertiary">
          {hint}
        </Text>
      )}

      {selected === null ? null : (
        <Text role="body" color="color.text.primary">
          {selected.name}
        </Text>
      )}

      <SearchField
        value={query}
        onChangeText={setQuery}
        onClear={() => {
          setQuery('');
        }}
        placeholder={selected === null ? 'Search for your country' : 'Change country'}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
      />

      {matches.slice(0, VISIBLE_MATCHES).map((country) => (
        <ListItem
          key={country.code}
          title={country.name}
          accessibilityLabel={country.name}
          // The selected state is announced through the visible name above
          // rather than through `accessibilityState`, which RNW drops before the
          // DOM. A row here is an action ("choose this"), not a toggle.
          onPress={() => {
            onChange(country.code);
            setQuery('');
          }}
        />
      ))}

      {matches.length > VISIBLE_MATCHES ? (
        <Text role="meta" color="color.text.tertiary">
          {`${String(matches.length - VISIBLE_MATCHES)} more — keep typing`}
        </Text>
      ) : null}

      {query.trim().length > 0 && matches.length === 0 ? (
        <Text role="bodySm" color="color.text.tertiary">
          No country matches that.
        </Text>
      ) : null}
    </View>
  );
}

export const CountryPicker = memo(CountryPickerComponent);
