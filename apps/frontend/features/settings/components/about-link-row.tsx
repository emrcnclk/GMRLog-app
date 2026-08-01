import { ListItem, Text, useTheme } from '@gmrlog/ui';
import * as Linking from 'expo-linking';
import { memo } from 'react';
import { View } from 'react-native';

import type { AboutLink } from '../model/about-model';

export interface AboutLinkRowProps {
  link: AboutLink;
}

function AboutLinkRowComponent({ link }: AboutLinkRowProps) {
  const theme = useTheme();

  if (link.placeholder || !link.href) {
    return (
      <View
        accessibilityLabel={`${link.title} unavailable`}
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          gap: theme.space('space.1'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <Text role="title" color="color.text.primary">
          {link.title}
        </Text>
        <Text role="meta" color="color.text.tertiary">
          {link.subtitle} · Placeholder — no in-app license screen yet.
        </Text>
      </View>
    );
  }

  return (
    <ListItem
      title={link.title}
      subtitle={link.subtitle}
      accessibilityLabel={link.title}
      onPress={() => {
        if (link.href) {
          void Linking.openURL(link.href);
        }
      }}
      trailing={
        <Text role="meta" color="color.text.tertiary">
          ›
        </Text>
      }
    />
  );
}

export const AboutLinkRow = memo(AboutLinkRowComponent);
