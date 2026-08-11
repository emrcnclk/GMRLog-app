import { CornerNotch, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { formatPlanPrice, type SubscriptionPlan } from '../model/subscription-model';

export interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}

/**
 * `SCREEN_REDESIGNS_2.md` §17: "Selected gets an accent border and a corner
 * notch; unselected gets a hairline." Same border-plus-`CornerNotch` language
 * `ProCard` already established for "singled out" surfaces — reused rather
 * than re-invented for the second card in the app that needs it.
 */
function SubscriptionPlanCardComponent({ plan, selected, onSelect }: SubscriptionPlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.label} plan, ${formatPlanPrice(plan.priceCents)} ${plan.period}${selected ? ', selected' : ''}`}
      onPress={onSelect}
      style={{
        borderRadius: theme.radius('radius.lg'),
        borderWidth: 1,
        borderColor: theme.color(selected ? 'color.accent.default' : 'color.border.default'),
        backgroundColor: theme.color('color.background.elevated'),
        padding: theme.space('space.4'),
        overflow: 'hidden',
      }}
    >
      {selected ? <CornerNotch /> : null}
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <View style={{ gap: theme.space('space.1') }}>
          <Text role="headline" color="color.text.primary">
            {plan.label}
          </Text>
          {plan.savingsNote !== null ? (
            <Text role="meta" color="color.accent.default">
              {plan.savingsNote}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.space('space.1') }}>
          <Text role="title2" color="color.text.primary">
            {formatPlanPrice(plan.priceCents)}
          </Text>
          <Text role="meta" color="color.text.tertiary" style={{ marginBottom: 3 }}>
            {plan.period}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const SubscriptionPlanCard = memo(SubscriptionPlanCardComponent);
