import {
  ACCENT_KEYS,
  ACCENT_LABELS,
  BottomSheet,
  Button,
  Chip,
  Divider,
  Section,
  Text,
  createThemeTokens,
  useTheme,
  type AccentKey,
} from '@gmrlog/ui';
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Pin } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  BANNER_STYLE_LABELS,
  CARD_STYLE_LABELS,
  CONSOLE_GENERATION_LABELS,
  HERO_STYLE_LABELS,
  PROFILE_WIDGET_LABELS,
  type ConsoleGeneration,
  type ProfileBannerStyle,
  type ProfileCardStyle,
  type ProfileHeroStyle,
  type ProfileWidgetId,
} from '../../hooks/profile-customization-model';
import { useProfileCustomization } from '../../hooks/use-profile-customization';

export interface CustomizationSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Platform names from the player's own library, for the favourite picker. */
  platformOptions: readonly string[];
}

/**
 * D3.27 Phase 5 — profile customization editor.
 *
 * Persists to device storage (see `profile-customization-model.ts` for why).
 * Reordering is offered as press-and-hold drag *plus* explicit up/down controls:
 * drag alone is inaccessible to switch control and screen-reader users, so the
 * buttons are the accessible path, not a fallback.
 */
function CustomizationSheetComponent({
  visible,
  onClose,
  platformOptions,
}: CustomizationSheetProps) {
  const theme = useTheme();
  const {
    customization,
    setAccent,
    setCardStyle,
    setHeroStyle,
    setBannerStyle,
    setFavoritePlatform,
    setConsoleGeneration,
    move,
    togglePinned,
    toggleHidden,
    reset,
  } = useProfileCustomization();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Customize profile">
      <ScrollView
        contentContainerStyle={{ padding: theme.space('space.4'), gap: theme.space('space.5') }}
      >
        <Text role="heading">Customize profile</Text>

        <Section title="Accent colour">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {ACCENT_KEYS.map((key) => (
              <AccentSwatch
                key={key}
                accent={key}
                selected={customization.accent === key}
                onPress={() => {
                  setAccent(key);
                }}
              />
            ))}
          </View>
        </Section>

        <Section title="Card style">
          <OptionRow
            options={Object.keys(CARD_STYLE_LABELS) as ProfileCardStyle[]}
            labels={CARD_STYLE_LABELS}
            selected={customization.cardStyle}
            onSelect={setCardStyle}
          />
        </Section>

        <Section title="Hero" description="The record card, or one of the two alternates.">
          <OptionRow
            options={Object.keys(HERO_STYLE_LABELS) as ProfileHeroStyle[]}
            labels={HERO_STYLE_LABELS}
            selected={customization.heroStyle}
            onSelect={setHeroStyle}
          />
        </Section>

        {customization.heroStyle === 'banner' ? (
          <Section title="Banner">
            <OptionRow
              options={Object.keys(BANNER_STYLE_LABELS) as ProfileBannerStyle[]}
              labels={BANNER_STYLE_LABELS}
              selected={customization.bannerStyle}
              onSelect={setBannerStyle}
            />
          </Section>
        ) : null}

        {platformOptions.length > 0 ? (
          <Section title="Favourite platform">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
              {platformOptions.map((platform) => (
                <Chip
                  key={platform}
                  selected={customization.favoritePlatform === platform}
                  accessibilityLabel={`Favourite platform ${platform}`}
                  onPress={() => {
                    setFavoritePlatform(
                      customization.favoritePlatform === platform ? null : platform,
                    );
                  }}
                >
                  {platform}
                </Chip>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Console generation">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {(Object.keys(CONSOLE_GENERATION_LABELS) as ConsoleGeneration[]).map((generation) => (
              <Chip
                key={generation}
                selected={customization.consoleGeneration === generation}
                accessibilityLabel={CONSOLE_GENERATION_LABELS[generation]}
                onPress={() => {
                  setConsoleGeneration(
                    customization.consoleGeneration === generation ? null : generation,
                  );
                }}
              >
                {CONSOLE_GENERATION_LABELS[generation]}
              </Chip>
            ))}
          </View>
        </Section>

        <Divider />

        <Section title="Widgets" description="Reorder, pin to the top, or hide entirely.">
          <View>
            {customization.widgetOrder.map((id, index) => (
              <WidgetRow
                key={id}
                id={id}
                index={index}
                total={customization.widgetOrder.length}
                pinned={customization.pinnedWidgets.includes(id)}
                hidden={customization.hiddenWidgets.includes(id)}
                onMove={move}
                onTogglePinned={togglePinned}
                onToggleHidden={toggleHidden}
              />
            ))}
          </View>
        </Section>

        <Button variant="secondary" accessibilityLabel="Reset customization" onPress={reset}>
          Reset to defaults
        </Button>
        <Button variant="primary" accessibilityLabel="Done customizing" onPress={onClose}>
          Done
        </Button>
      </ScrollView>
    </BottomSheet>
  );
}

function OptionRow<T extends string>({
  options,
  labels,
  selected,
  onSelect,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
      {options.map((option) => (
        <Chip
          key={option}
          selected={selected === option}
          accessibilityLabel={labels[option]}
          onPress={() => {
            onSelect(option);
          }}
        >
          {labels[option]}
        </Chip>
      ))}
    </View>
  );
}

/**
 * Accent preview swatch. Colours are pulled from the real token pipeline for the
 * active scheme, so the dot always matches what selecting it will produce.
 */
function AccentSwatch({
  accent,
  selected,
  onPress,
}: {
  accent: AccentKey;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const preview = createThemeTokens(theme.scheme, accent).color['color.accent.default'];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${ACCENT_LABELS[accent]} accent`}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space('space.1'),
      }}
    >
      <View
        style={{
          width: theme.space('space.8'),
          height: theme.space('space.8'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: preview,
          borderWidth: selected ? 3 : 1,
          borderColor: selected
            ? theme.color('color.text.primary')
            : theme.color('color.border.default'),
        }}
      />
      <Text role="meta" color={selected ? 'color.text.primary' : 'color.text.tertiary'}>
        {ACCENT_LABELS[accent]}
      </Text>
    </Pressable>
  );
}

function WidgetRow({
  id,
  index,
  total,
  pinned,
  hidden,
  onMove,
  onTogglePinned,
  onToggleHidden,
}: {
  id: ProfileWidgetId;
  index: number;
  total: number;
  pinned: boolean;
  hidden: boolean;
  onMove: (id: ProfileWidgetId, direction: 'up' | 'down') => void;
  onTogglePinned: (id: ProfileWidgetId) => void;
  onToggleHidden: (id: ProfileWidgetId) => void;
}) {
  const theme = useTheme();
  const label = PROFILE_WIDGET_LABELS[id];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.2'),
        paddingVertical: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        opacity: hidden ? 0.5 : 1,
      }}
    >
      <GripVertical size={18} color={theme.color('color.text.tertiary')} />

      <Text role="label" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>

      <IconAction
        label={`Move ${label} up`}
        disabled={index === 0}
        onPress={() => {
          onMove(id, 'up');
        }}
      >
        <ChevronUp
          size={18}
          color={theme.color(index === 0 ? 'color.text.disabled' : 'color.text.secondary')}
        />
      </IconAction>

      <IconAction
        label={`Move ${label} down`}
        disabled={index === total - 1}
        onPress={() => {
          onMove(id, 'down');
        }}
      >
        <ChevronDown
          size={18}
          color={theme.color(index === total - 1 ? 'color.text.disabled' : 'color.text.secondary')}
        />
      </IconAction>

      <IconAction
        label={pinned ? `Unpin ${label}` : `Pin ${label}`}
        selected={pinned}
        onPress={() => {
          onTogglePinned(id);
        }}
      >
        <Pin
          size={18}
          color={theme.color(pinned ? 'color.accent.default' : 'color.text.secondary')}
        />
      </IconAction>

      <IconAction
        label={hidden ? `Show ${label}` : `Hide ${label}`}
        selected={hidden}
        onPress={() => {
          onToggleHidden(id);
        }}
      >
        {hidden ? (
          <EyeOff size={18} color={theme.color('color.text.tertiary')} />
        ) : (
          <Eye size={18} color={theme.color('color.text.secondary')} />
        )}
      </IconAction>
    </View>
  );
}

function IconAction({
  label,
  onPress,
  disabled = false,
  selected = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

export const CustomizationSheet = memo(CustomizationSheetComponent);
