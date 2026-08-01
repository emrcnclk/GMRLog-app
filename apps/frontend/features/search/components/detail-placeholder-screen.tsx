import { Button, Container, Screen, Text, useTheme } from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

export interface DetailPlaceholderProps {
  entityLabel: string;
}

/**
 * Shared detail placeholder for Search result navigation (D3.5).
 * Full detail surfaces arrive in later sprints.
 */
export function DetailPlaceholderScreen({ entityLabel }: DetailPlaceholderProps) {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  return (
    <Screen>
      <Container>
        <View style={{ gap: theme.space('space.4') }}>
          <Text role="heading">{entityLabel}</Text>
          <Text role="body" color="color.text.secondary">
            Detail view placeholder. Full {entityLabel.toLowerCase()} experience arrives later.
          </Text>
          {id ? (
            <Text role="meta" color="color.text.tertiary">
              id: {id}
            </Text>
          ) : null}
          <Button
            variant="secondary"
            accessibilityLabel="Go back"
            onPress={() => {
              router.back();
            }}
          >
            Back
          </Button>
        </View>
      </Container>
    </Screen>
  );
}
