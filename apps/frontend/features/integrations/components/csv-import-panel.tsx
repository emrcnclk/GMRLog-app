import { Button, Text, TextField, useTheme } from '@gmrlog/ui';
import { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  CSV_FORMAT_OPTIONS,
  csvFormatLabel,
  formatCsvPreviewSampleRow,
  formatCsvPreviewSummary,
  isCsvImportReady,
  resolveCsvPreviewView,
  type CsvImportFormatValue,
} from '../hooks/integrations-model';
import { useImportCsv, usePreviewCsv } from '../hooks/use-integrations';

export interface CsvImportPanelProps {
  disabled?: boolean;
  onError?: (message: string) => void;
  onImported?: () => void;
}

function CsvImportPanelComponent({ disabled = false, onError, onImported }: CsvImportPanelProps) {
  const theme = useTheme();
  const importCsv = useImportCsv();
  const previewCsv = usePreviewCsv();
  const [csv, setCsv] = useState('');
  const [format, setFormat] = useState<CsvImportFormatValue>('generic');
  const [localError, setLocalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const busy = importCsv.isPending || previewCsv.isPending;
  const canPreview = isCsvImportReady(csv, format) && !busy && !disabled;
  const canImport = isCsvImportReady(csv, format) && !busy && !disabled && previewCsv.isSuccess;
  const hit = theme.space('space.12');

  const previewView = useMemo(
    () =>
      resolveCsvPreviewView({
        isPreviewing: previewCsv.isPending,
        previewError: previewCsv.isError,
        previewErrorValue: previewCsv.error,
        preview: previewCsv.data ?? null,
      }),
    [previewCsv.data, previewCsv.error, previewCsv.isError, previewCsv.isPending],
  );

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Text role="title" color="color.text.primary">
        CSV import
      </Text>
      <Text role="caption" color="color.text.tertiary">
        Paste an export from SteamDB, Backloggd, or another supported format.
      </Text>

      <View style={{ gap: theme.space('space.2') }}>
        <Text role="label" color="color.text.secondary">
          Format
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
          {CSV_FORMAT_OPTIONS.map((option) => {
            const selected = option === format;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: busy || disabled }}
                accessibilityLabel={`CSV format ${csvFormatLabel(option)}`}
                disabled={busy || disabled}
                onPress={() => {
                  setFormat(option);
                  previewCsv.reset();
                }}
                style={{
                  minHeight: hit,
                  paddingHorizontal: theme.space('space.3'),
                  justifyContent: 'center',
                  borderRadius: theme.radius('radius.md'),
                  borderWidth: 1,
                  borderColor: selected
                    ? theme.color('color.interactive.primary')
                    : theme.color('color.border.default'),
                  backgroundColor: selected
                    ? theme.color('color.surface.secondary')
                    : theme.color('color.background.primary'),
                }}
              >
                <Text role="label" color={selected ? 'color.text.primary' : 'color.text.secondary'}>
                  {csvFormatLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="CSV content"
        value={csv}
        onChangeText={(value) => {
          setCsv(value);
          previewCsv.reset();
          setStatusMessage(null);
        }}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        editable={!busy && !disabled}
        placeholder="title,status,playtime…"
        error={localError ?? undefined}
        accessibilityLabel="CSV content"
        style={{ minHeight: theme.space('space.24') }}
      />

      {previewView.status === 'preview_ready' && previewView.preview ? (
        <View style={{ gap: theme.space('space.2') }}>
          <Text role="label" color="color.text.secondary">
            Preview
          </Text>
          <Text role="caption" color="color.text.tertiary">
            {formatCsvPreviewSummary(previewView.preview)}
          </Text>
          {previewView.preview.sample.slice(0, 3).map((row, index) => (
            <Text key={`sample-${String(index)}`} role="meta" color="color.text.secondary">
              {formatCsvPreviewSampleRow(row)}
            </Text>
          ))}
        </View>
      ) : null}

      {previewView.status === 'preview_error' ? (
        <Text role="caption" color="color.status.error">
          {previewView.error instanceof Error ? previewView.error.message : 'Preview failed'}
        </Text>
      ) : null}

      {statusMessage ? (
        <Text role="caption" color="color.status.success">
          {statusMessage}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
        <Button
          variant="secondary"
          accessibilityLabel="Preview CSV"
          disabled={!canPreview}
          loading={previewCsv.isPending}
          onPress={() => {
            setLocalError(null);
            setStatusMessage(null);
            previewCsv.mutate(
              { csv, format },
              {
                onError: (error) => {
                  const message = error instanceof Error ? error.message : 'Preview failed';
                  setLocalError(message);
                  onError?.(message);
                },
              },
            );
          }}
        >
          Preview
        </Button>
        <Button
          variant="primary"
          accessibilityLabel="Import CSV"
          disabled={!canImport}
          loading={importCsv.isPending}
          onPress={() => {
            setLocalError(null);
            setStatusMessage(null);
            importCsv.mutate(
              { csv, format },
              {
                onSuccess: () => {
                  setCsv('');
                  previewCsv.reset();
                  setStatusMessage('Import started. Check sync history for progress.');
                  onImported?.();
                },
                onError: (error) => {
                  const message = error instanceof Error ? error.message : 'Import failed';
                  setLocalError(message);
                  onError?.(message);
                },
              },
            );
          }}
        >
          Import
        </Button>
      </View>
    </View>
  );
}

export const CsvImportPanel = memo(CsvImportPanelComponent);
