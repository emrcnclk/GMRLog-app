import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { aboutCopyright, aboutVersionLine } from '../model/about-model';

export interface VersionFooterProps {
  version: string;
  build: string;
}

function VersionFooterComponent({ version, build }: VersionFooterProps) {
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
      <Text role="caption" color="color.text.tertiary">
        {aboutCopyright()}
      </Text>
    </View>
  );
}

export const VersionFooter = memo(VersionFooterComponent);
