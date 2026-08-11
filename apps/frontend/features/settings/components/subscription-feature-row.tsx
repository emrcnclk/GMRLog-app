import { Icon, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface SubscriptionFeatureRowProps {
  label: string;
  isLast: boolean;
}

/** §17: "hairline-separated rows, each a 16px outlined check icon plus a label. No ticks in coloured circles." */
function SubscriptionFeatureRowComponent({ label, isLast }: SubscriptionFeatureRowProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <Icon name="check" decorative size={16} color="color.text.secondary" />
      <Text role="body" color="color.text.primary" style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

export const SubscriptionFeatureRow = memo(SubscriptionFeatureRowComponent);
