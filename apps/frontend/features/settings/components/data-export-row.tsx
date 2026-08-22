import { Button, ErrorBanner, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { useDataExportAction } from '../hooks/use-data-export';

function DataExportRowComponent() {
  const theme = useTheme();
  const dataExport = useDataExportAction();

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
      }}
    >
      <Text role="title" color="color.text.primary">
        Download your data
      </Text>
      <Text role="meta" color="color.text.tertiary">
        POST /me/export — account, gaming activity, social, technical and optional categories, once
        every 24 hours.
      </Text>
      {dataExport.error ? (
        <ErrorBanner title={dataExport.error.title} description={dataExport.error.description} />
      ) : null}
      {dataExport.done && !dataExport.error ? (
        <Text role="meta" color="color.text.secondary">
          Your export downloaded.
        </Text>
      ) : null}
      <Button
        variant="secondary"
        accessibilityLabel="Download your data"
        loading={dataExport.busy}
        disabled={dataExport.busy}
        onPress={() => {
          void dataExport.run();
        }}
      >
        Download my data
      </Button>
    </View>
  );
}

export const DataExportRow = memo(DataExportRowComponent);
