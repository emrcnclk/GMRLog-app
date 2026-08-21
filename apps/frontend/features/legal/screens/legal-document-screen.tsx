import type { LegalDocumentId } from '@gmrlog/types';
import {
  Button,
  EmptyState,
  ErrorState,
  Loading,
  Markdown,
  Screen,
  ScreenTitle,
  useTheme,
} from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { useLegalDocument } from '../hooks/use-legal-document';
import { legalVersionLine } from '../model/legal-model';

/**
 * A reading measure, not a spacing value — the same class of compositional
 * constant as `AUTH_MEASURE` (280) and the profile case cover's 98.
 *
 * `CONTENT_MAX_WIDTH` (1200) is the app's layout cap and is far too wide for
 * continuous prose: at `body`'s size a 1200px line runs past 140 characters,
 * roughly twice the measure at which a reader stops finding the next line.
 * 680 keeps it near 70. It is not a token because the scale holds no
 * three-digit values, which is the reason `AUTH_MEASURE` is a plain number too.
 */
export const LEGAL_MEASURE = 680;

export interface LegalDocumentScreenProps {
  /** `null` when the path param matched no known document. */
  document: LegalDocumentId | null;
  /** What the reader came from, named — `ScreenTitle`'s convention. */
  backLabel?: string;
}

export function LegalDocumentScreen({ document, backLabel = '← Back' }: LegalDocumentScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const view = useLegalDocument(document);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onRetry = useCallback(() => {
    void view.refresh();
  }, [view]);

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.4'),
        }}
      >
        <ScreenTitle
          title={view.title.length > 0 ? view.title : 'Legal'}
          meta={legalVersionLine(view.version, view.effectiveDate)}
          backLabel={backLabel}
          onPressBack={onBack}
        />

        <View
          style={{
            paddingHorizontal: theme.space('space.5'),
            maxWidth: LEGAL_MEASURE,
            // Left-aligned, not centred: Nocturne is asymmetric by principle,
            // and 8.1 already made this call once for the capped Player screen.
            alignSelf: 'flex-start',
            width: '100%',
          }}
        >
          {document === null ? (
            <EmptyState
              title="Document not found"
              description="That link points at a document that does not exist. Open Settings › About for the current legal documents."
            />
          ) : null}

          {document !== null && view.status === 'loading' ? (
            <Loading label="Loading document" />
          ) : null}

          {view.status === 'offline' ? (
            <ErrorState
              title="You are offline"
              description="This document is served from GMRLog and needs a connection. Reconnect and try again."
              action={
                <Button variant="ghost" onPress={onRetry}>
                  Try again
                </Button>
              }
            />
          ) : null}

          {view.status === 'error' ? (
            <ErrorState
              title="Could not load this document"
              description="Something went wrong fetching the text. Nothing is wrong with your account."
              action={
                <Button variant="ghost" onPress={onRetry}>
                  Retry
                </Button>
              }
            />
          ) : null}

          {view.status === 'empty' ? (
            <EmptyState
              title="This document is empty"
              description="The document exists but carries no text. Please contact support before relying on it."
            />
          ) : null}

          {view.status === 'ready' ? <Markdown source={view.body} /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
