import type { LibraryStatusValue } from '@gmrlog/types';
import { Button, Dialog, Text, TextField, useTheme } from '@gmrlog/ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export interface CompletionDialogProps {
  visible: boolean;
  /** The shelf the entry is already on — passed straight back, never changed here. */
  status: LibraryStatusValue;
  current: number | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (percent: number | null) => void;
}

/** The widest string the field accepts — `100`. */
const MAX_LENGTH = 3;

/**
 * 13.1 — how far the player got, as their own claim.
 *
 * Digits only, for the same reason the date of birth is: a numeric keypad has
 * nothing but digits on it, and a percent needs nothing else. `inputMode` is
 * what RNW reads; `keyboardType` stays beside it for native.
 *
 * Clearing is a first-class action rather than a trick with an empty field.
 * A player who typed a figure by mistake needs a way back to "not said", and
 * that is a different state from zero — the same distinction the nullable
 * column and the null-versus-zero rule in `formatCompletionPercent` keep.
 */
export function CompletionDialog({
  visible,
  status,
  current,
  saving,
  error,
  onClose,
  onSave,
}: CompletionDialogProps) {
  const theme = useTheme();
  const [value, setValue] = useState(current === null ? '' : String(current));

  // Re-seed each time it opens: the dialog outlives one editing session, and a
  // stale figure from the previous open would be presented as the current one.
  useEffect(() => {
    if (visible) {
      setValue(current === null ? '' : String(current));
    }
  }, [visible, current]);

  const digits = value.replace(/\D/g, '').slice(0, MAX_LENGTH);
  const parsed = digits.length === 0 ? null : Number(digits);
  const outOfRange = parsed !== null && parsed > 100;

  return (
    <Dialog
      title="How far did you get?"
      visible={visible}
      onClose={onClose}
      actions={
        <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
          <Button variant="ghost" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          {current !== null ? (
            <Button
              variant="ghost"
              onPress={() => {
                onSave(null);
              }}
              disabled={saving}
            >
              Clear
            </Button>
          ) : null}
          <Button
            variant="accent"
            onPress={() => {
              onSave(parsed);
            }}
            disabled={saving || outOfRange || parsed === null}
          >
            Save
          </Button>
        </View>
      }
    >
      <View style={{ gap: theme.space('space.3') }}>
        <Text role="body" color="color.text.secondary">
          {`Your own figure for this game, 0 to 100. It stays on the ${status} shelf either way.`}
        </Text>
        <TextField
          label="Completion"
          placeholder="0-100"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
          value={digits}
          onChangeText={setValue}
          editable={!saving}
          error={outOfRange ? 'A percentage cannot go past 100.' : (error ?? undefined)}
        />
      </View>
    </Dialog>
  );
}
