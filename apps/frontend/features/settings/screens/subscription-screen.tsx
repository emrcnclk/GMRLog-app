import { Button, HIDDEN_FROM_ASSISTIVE_TECH, Icon, IconButton, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubscriptionFeatureRow } from '../components/subscription-feature-row';
import { SubscriptionPlanCard } from '../components/subscription-plan-card';
import {
  findPlan,
  formatPlanPrice,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '../model/subscription-model';

/**
 * §17 Subscription. Dismissed rather than navigated back from — same
 * reasoning `ComposerHeader` states for its own ✕ — so the leading control is
 * a close button, not the back chevron `SettingsScreenChrome` uses elsewhere.
 * No `NavHeader`/`SettingsScreenChrome` at all: both draw a bordered title bar,
 * which would sit on top of the "GMRLOG Pro" title §17 makes the actual
 * heading of the screen, competing with the one thing the radial glow behind
 * it is meant to draw the eye to.
 *
 * There is only one real state here (see `subscription-model.ts`): nothing to
 * load, nothing that can fail, no "already subscribed" branch, because no
 * data source anywhere says a viewer is one. Plan selection is local UI state
 * with nothing behind it to persist to.
 */
export function SubscriptionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('monthly');
  const selectedPlan = findPlan(selectedPlanId);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.color('color.background.primary') }}>
      {/* Radial accent glow (§17): no gradient dependency, same reasoning
          `ProCard` already recorded — a wide, low-opacity accent shadow reads
          as a soft glow without a `conic-gradient`/canvas primitive this
          system doesn't take. `shadow.sm`'s own baked-in 0.08 opacity is the
          token-sourced stand-in for "very low opacity." */}
      <View
        {...HIDDEN_FROM_ASSISTIVE_TECH}
        style={[
          {
            position: 'absolute',
            top: -60,
            left: theme.space('space.6'),
            right: theme.space('space.6'),
            height: 120,
            borderRadius: 999,
            backgroundColor: theme.color('color.accent.default'),
          },
          {
            ...theme.elevation('shadow.sm'),
            shadowColor: theme.color('color.accent.default'),
            shadowOffset: { width: 0, height: 40 },
            shadowRadius: 60,
          },
        ]}
      />

      <View style={{ paddingTop: insets.top + theme.space('space.2') }}>
        <IconButton
          accessibilityLabel="Close"
          size="lg"
          onPress={onClose}
          hitSlop={8}
          style={{ marginLeft: theme.space('space.2') }}
        >
          <Icon name="x" decorative size={22} color="color.text.primary" />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.space('space.5'),
          paddingTop: theme.space('space.4'),
          paddingBottom: theme.space('space.4'),
          gap: theme.space('space.6'),
        }}
      >
        <View style={{ gap: theme.space('space.2') }}>
          <Text role="title1" color="color.text.primary">
            GMRLOG Pro
          </Text>
          <Text role="body" color="color.text.tertiary">
            Widgets, themes and unlimited lists for the way you actually play.
          </Text>
        </View>

        <View style={{ gap: theme.space('space.3') }}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              selected={plan.id === selectedPlanId}
              onSelect={() => {
                setSelectedPlanId(plan.id);
              }}
            />
          ))}
        </View>

        <View>
          {SUBSCRIPTION_FEATURES.map((feature, index) => (
            <SubscriptionFeatureRow
              key={feature}
              label={feature}
              isLast={index === SUBSCRIPTION_FEATURES.length - 1}
            />
          ))}
        </View>

        <Text role="bodySm" color="color.text.tertiary">
          Pro is cosmetic and tooling only — it never changes your standing.
        </Text>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: theme.space('space.5'),
          paddingTop: theme.space('space.3'),
          paddingBottom: insets.bottom + theme.space('space.3'),
          gap: theme.space('space.2'),
          borderTopWidth: 1,
          borderTopColor: theme.color('color.border.default'),
        }}
      >
        <Button variant="accent" disabled style={{ width: '100%' }}>
          {`Continue — ${formatPlanPrice(selectedPlan.priceCents)} ${selectedPlan.period}`}
        </Button>
        <Text role="meta" color="color.text.tertiary">
          RENEWS AUTOMATICALLY · CANCEL ANYTIME · RESTORE PURCHASES
        </Text>
        <Text role="bodySm" color="color.text.tertiary">
          Placeholder — no purchase backend exists yet.
        </Text>
      </View>
    </View>
  );
}
