import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { aboutCopyright, aboutSignedInLine, aboutVersionLine } from '../model/about-model';

export interface VersionFooterProps {
  version: string;
  build: string;
  /** Viewer's handle. Omitted line when there is none to show. */
  handle?: string;
}

/**
 * The monospace footer (SCREEN_REDESIGNS.md §9): "version, build, signed-in
 * handle. Small, factual, no styling." One `role="meta"` block — the ramp's
 * own 11px monospace tertiary — rather than the mixed sans/mono treatment
 * this footer used before.
 */
function VersionFooterComponent({ version, build, handle }: VersionFooterProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Version and copyright"
      style={{
        padding: theme.space('space.6'),
        alignItems: 'center',
        gap: theme.space('space.1'),
      }}
    >
      <Text role="meta" color="color.text.tertiary">
        {aboutVersionLine(version, build)}
      </Text>
      {handle !== undefined ? (
        <Text role="meta" color="color.text.tertiary">
          {aboutSignedInLine(handle)}
        </Text>
      ) : null}
      <Text role="meta" color="color.text.tertiary">
        {aboutCopyright()}
      </Text>
    </View>
  );
}

export const VersionFooter = memo(VersionFooterComponent);
