import { Button, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

/** Login OAuth providers (AUTH-001 · Google · Discord · Steam). Apple is Beta — omitted. */
export type AuthOauthProvider = 'google' | 'discord' | 'steam';

interface OauthProviderOption {
  id: AuthOauthProvider;
  label: string;
}

const OAUTH_PROVIDERS: readonly OauthProviderOption[] = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'discord', label: 'Continue with Discord' },
  { id: 'steam', label: 'Continue with Steam' },
] as const;

export interface OauthProviderButtonsProps {
  disabled?: boolean;
  onSelect: (provider: AuthOauthProvider) => void;
}

/**
 * Provider sign-in actions — secondary peers under email form (AUTH-001).
 */
export function OauthProviderButtons({ disabled = false, onSelect }: OauthProviderButtonsProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <Text role="caption" color="color.text.secondary" style={{ textAlign: 'center' }}>
        Or continue with
      </Text>
      {OAUTH_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          variant="secondary"
          accessibilityLabel={provider.label}
          disabled={disabled}
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
