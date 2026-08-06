import { Button, useTheme } from '@gmrlog/ui';
import { Gamepad2, Globe, MessageCircle, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { AUTH_BUTTON_HEIGHT } from './auth-layout';

/** Login OAuth providers (AUTH-001 · Google · Discord · Steam). Apple is Beta — omitted. */
export type AuthOauthProvider = 'google' | 'discord' | 'steam';

interface OauthProviderOption {
  id: AuthOauthProvider;
  label: string;
  icon: LucideIcon;
}

/**
 * §1 asks for "an icon and a label" on every provider button. **These are not
 * brand marks.** Lucide ships no Google, Discord or Steam logo — the brand set
 * was dropped from the library — and pulling in a second icon package for three
 * glyphs is the same new-dependency call `GradientScrim` and `HatchOverlay`
 * already declined. Each button takes an honest *category* glyph instead: what
 * kind of thing the provider is, never a claim to be its logo. A brand-adjacent
 * stand-in (lucide's `Chrome` for Google, say) would be the wrong answer twice
 * over — misleading and still not the real mark.
 */
const OAUTH_PROVIDERS: readonly OauthProviderOption[] = [
  { id: 'google', label: 'Continue with Google', icon: Globe },
  { id: 'discord', label: 'Continue with Discord', icon: MessageCircle },
  { id: 'steam', label: 'Continue with Steam', icon: Gamepad2 },
] as const;

export interface OauthProviderButtonsProps {
  disabled?: boolean;
  onSelect: (provider: AuthOauthProvider) => void;
}

/**
 * The three provider rows of §1's bottom zone.
 *
 * Every one is a plain hairline (`ghost`): §1 gives the accent border to the
 * *primary* provider, and none of these three can sign anyone in yet — the OAuth
 * flows are Phase 4, so tapping one still raises the "not available yet" banner
 * the screen already owned. The accent sits on the one path that works today.
 *
 * No "Or continue with" divider: §1's bottom zone is a single uninterrupted
 * stack, and a caption between the email button and these three would split one
 * list into two.
 */
export function OauthProviderButtons({ disabled = false, onSelect }: OauthProviderButtonsProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space('space.2') }}>
      {OAUTH_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          variant="ghost"
          accessibilityLabel={provider.label}
          disabled={disabled}
          icon={
            <provider.icon size={18} color={theme.color('color.text.primary')} strokeWidth={1.75} />
          }
          style={{ minHeight: theme.space(AUTH_BUTTON_HEIGHT) }}
          onPress={() => {
            onSelect(provider.id);
          }}
        >
          {provider.label}
        </Button>
      ))}
    </View>
  );
}
