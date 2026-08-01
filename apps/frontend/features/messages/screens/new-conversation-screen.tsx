import {
  Button,
  ErrorBanner,
  Icon,
  IconButton,
  Screen,
  Text,
  TextField,
  useTheme,
} from '@gmrlog/ui';
import { conversationCreateSchema } from '@gmrlog/validators';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { ScreenHeader } from '../../../src/navigation/screen-header';
import { useConnectivityStore } from '../../../src/state/stores';
import { useCreateConversation } from '../hooks/use-messaging';

/**
 * New conversation — participant picker is a placeholder (opaque user ids)
 * until a dedicated people picker ships. Uses POST /conversations only.
 */
export function NewConversationScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const createMutation = useCreateConversation();
  const [draftId, setDraftId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);

  const hit = theme.space('space.12');
  const canCreate = selectedIds.length > 0 && !createMutation.isPending;

  const helper = useMemo(
    () =>
      'People picker arrives later. Add another player by user id for now. You are included automatically.',
    [],
  );

  const addParticipant = () => {
    const id = draftId.trim();
    if (id.length === 0) {
      return;
    }
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setDraftId('');
  };

  const removeParticipant = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const onCreate = async () => {
    setBanner(null);
    const parsed = conversationCreateSchema.safeParse({
      participantUserIds: selectedIds,
    });
    if (!parsed.success) {
      setBanner({
        title: 'Check participants',
        description: parsed.error.issues[0]?.message ?? 'Add at least one player.',
      });
      return;
    }
    try {
      const conversation = await createMutation.mutateAsync(parsed.data);
      router.replace(`/(app)/messages/${conversation.id}`);
    } catch (error) {
      const mapped = mapAuthError(error, isOnline);
      setBanner({ title: mapped.title, description: mapped.description });
    }
  };

  return (
    <Screen edges={[]} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScreenHeader
        title="New Conversation"
        titleRole="title"
        leading={
          <IconButton
            accessibilityLabel="Close"
            size="lg"
            onPress={() => {
              router.back();
            }}
            hitSlop={8}
          >
            <Icon name="x" decorative size={22} color="color.text.primary" />
          </IconButton>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.space('space.4'),
            gap: theme.space('space.5'),
            paddingBottom: insets.bottom + theme.space('space.8'),
          }}
        >
          {banner ? <ErrorBanner title={banner.title} description={banner.description} /> : null}

          <View style={{ gap: theme.space('space.2') }}>
            <Text role="title" color="color.text.primary">
              Participants
            </Text>
            <Text role="body" color="color.text.secondary">
              {helper}
            </Text>
          </View>

          <View
            accessibilityLabel="User picker placeholder"
            style={{
              gap: theme.space('space.3'),
              padding: theme.space('space.3'),
              borderRadius: theme.radius('radius.md'),
              backgroundColor: theme.color('color.surface.secondary'),
            }}
          >
            <Text role="label" color="color.text.secondary">
              User picker placeholder
            </Text>
            <TextField
              label="User id"
              value={draftId}
              onChangeText={setDraftId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!createMutation.isPending}
              placeholder="Paste a user id"
              accessibilityLabel="Participant user id"
              returnKeyType="done"
              onSubmitEditing={addParticipant}
            />
            <Button
              variant="secondary"
              accessibilityLabel="Add participant"
              disabled={draftId.trim().length === 0 || createMutation.isPending}
              onPress={addParticipant}
            >
              Add
            </Button>
          </View>

          <View style={{ gap: theme.space('space.2') }}>
            <Text role="label" color="color.text.secondary">
              Selected ({String(selectedIds.length)})
            </Text>
            {selectedIds.length === 0 ? (
              <Text role="meta" color="color.text.tertiary">
                No participants selected yet.
              </Text>
            ) : (
              selectedIds.map((id) => (
                <View
                  key={id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: hit,
                    paddingHorizontal: theme.space('space.3'),
                    borderRadius: theme.radius('radius.md'),
                    borderWidth: 1,
                    borderColor: theme.color('color.border.default'),
                  }}
                >
                  <Text
                    role="body"
                    color="color.text.primary"
                    numberOfLines={1}
                    style={{ flex: 1 }}
                  >
                    {id}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${id}`}
                    onPress={() => {
                      removeParticipant(id);
                    }}
                    hitSlop={8}
                  >
                    <Text role="label" color="color.interactive.primary">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <Button
            variant="primary"
            accessibilityLabel="Create conversation"
            disabled={!canCreate}
            loading={createMutation.isPending}
            onPress={() => {
              void onCreate();
            }}
          >
            Create
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
