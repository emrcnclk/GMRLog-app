import type { LegalDocumentId, LegalDocumentSummaryResponse } from '@gmrlog/types';
import {
  Button,
  ErrorState,
  Loading,
  Markdown,
  Screen,
  ScreenTitle,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { useLegalDocument } from '../hooks/use-legal-document';
import { useLegalLocale } from '../hooks/use-legal-locale';
import { legalVersionLine } from '../model/legal-model';

import { LEGAL_MEASURE } from './legal-document-screen';

/**
 * 12.4b — one document's body inside a gate screen, isolated in its own
 * component so each call to `useLegalDocument` belongs to its own component
 * instance. `disclose` can carry more than one document (`resolveLegalConsentGate`
 * deliberately returns the whole undisclosed batch, not one at a time), and
 * calling the hook inside a loop in the parent would tie the number of hook
 * calls to server-driven data — exactly what the rules of hooks forbid.
 */
function GateDocumentBody({ documentId }: { documentId: LegalDocumentId }) {
  const theme = useTheme();
  // The gate is the one place a document is read *in order to decide*, so the
  // translation shown here and the `locale` the decision is recorded against
  // have to be the same one — `useDecideLegalConsent` resolves it identically.
  const { locale } = useLegalLocale();
  const view = useLegalDocument(documentId, locale);

  const onRetry = useCallback(() => {
    void view.refresh();
  }, [view]);

  return (
    <View style={{ gap: theme.space('space.3') }}>
      {view.title.length > 0 ? (
        <View style={{ gap: theme.space('space.1') }}>
          <Text role="title3" color="color.text.primary">
            {view.title}
          </Text>
          <Text role="meta" color="color.text.tertiary">
            {legalVersionLine(view.version, view.effectiveDate)}
          </Text>
        </View>
      ) : null}

      {view.status === 'loading' ? <Loading label="Loading document" /> : null}

      {view.status === 'offline' || view.status === 'error' ? (
        <ErrorState
          title={view.status === 'offline' ? 'You are offline' : 'Could not load this document'}
          description={
            view.status === 'offline'
              ? 'This document is served from GMRLog and needs a connection. Reconnect and try again.'
              : 'Something went wrong fetching the text. Nothing is wrong with your account.'
          }
          action={
            <Button variant="ghost" onPress={onRetry}>
              Try again
            </Button>
          }
        />
      ) : null}

      {view.status === 'ready' ? <Markdown source={view.body} /> : null}
    </View>
  );
}

/**
 * The shared chrome every gate screen renders inside: capped-width, no back
 * affordance — there is nowhere to go back to, the only ways out are the
 * actions passed as `footer`. The same reading measure and left-alignment
 * `LegalDocumentScreen` (12.3) already established.
 */
function GateShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.space('space.10'),
          gap: theme.space('space.4'),
        }}
      >
        <ScreenTitle title={title} meta={meta} />
        <View
          style={{
            paddingHorizontal: theme.space('space.5'),
            maxWidth: LEGAL_MEASURE,
            alignSelf: 'flex-start',
            width: '100%',
            gap: theme.space('space.6'),
          }}
        >
          {children}
        </View>
      </ScrollView>
    </Screen>
  );
}

export interface DiscloseGateScreenProps {
  documents: readonly LegalDocumentSummaryResponse[];
  onContinue: () => void;
  pending: boolean;
}

/**
 * 12.4b — nothing to decide here, only to show. Every undisclosed notice
 * renders in one scroll rather than one screen per document, since there are
 * at most two today (Privacy Policy, Aydınlatma Metni) and stepping through a
 * wizard for two short notices would be more friction than the notices
 * themselves. One "Continue" acknowledges the whole batch in a single call.
 */
export function DiscloseGateScreen({ documents, onContinue, pending }: DiscloseGateScreenProps) {
  const theme = useTheme();

  return (
    <GateShell title="Before you continue">
      <Text role="body" color="color.text.secondary">
        A couple of documents changed since you last used GMRLog. Nothing here needs a decision — we
        just want you to have seen them.
      </Text>

      {documents.map((document) => (
        <GateDocumentBody key={document.id} documentId={document.id} />
      ))}

      <Button
        variant="accent"
        loading={pending}
        style={{ minHeight: theme.space('space.12') }}
        onPress={onContinue}
      >
        Continue
      </Button>
    </GateShell>
  );
}

export interface DecideGateScreenProps {
  document: LegalDocumentSummaryResponse;
  onAccept: () => void;
  onDecline: () => void;
  pending: boolean;
}

/**
 * 12.4b — the surface `outstanding` exists for. Only ever the Terms of
 * Service in practice (`ACCEPTANCE_REQUIRED_DOCUMENT_IDS` holds one entry),
 * reached by an OAuth sign-up seeing this for the first time or any account
 * whose Terms moved to a new version.
 */
export function DecideGateScreen({
  document,
  onAccept,
  onDecline,
  pending,
}: DecideGateScreenProps) {
  const theme = useTheme();

  return (
    <GateShell
      title={`Review the ${document.title}`}
      meta={legalVersionLine(document.version, document.effectiveDate)}
    >
      <GateDocumentBody documentId={document.id} />

      <View style={{ gap: theme.space('space.3') }}>
        <Button
          variant="accent"
          loading={pending}
          style={{ minHeight: theme.space('space.12') }}
          onPress={onAccept}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          style={{ minHeight: theme.space('space.12') }}
          onPress={onDecline}
        >
          Decline
        </Button>
      </View>
    </GateShell>
  );
}

export interface BlockedGateScreenProps {
  document: LegalDocumentSummaryResponse;
  onReview: () => void;
  onLogOut: () => void;
}

/**
 * 12.4b — shown once, to a player who has already declined or withdrawn from
 * a document GMRLog cannot run without. This is not the same prompt as
 * `DecideGateScreen` shown again: it states the consequence of the answer
 * already on record and offers exactly two ways forward, rather than
 * re-asking the same question — which is the nag F2.27 §7 forbids.
 */
export function BlockedGateScreen({ document, onReview, onLogOut }: BlockedGateScreenProps) {
  const theme = useTheme();

  return (
    <GateShell title="You're signed out of GMRLog for now">
      <Text role="body" color="color.text.secondary">
        {`You declined the current ${document.title}, and GMRLog can't run without it — the same way it couldn't when you created your account. You can review it again, or log out.`}
      </Text>

      <View style={{ gap: theme.space('space.3') }}>
        <Button variant="accent" style={{ minHeight: theme.space('space.12') }} onPress={onReview}>
          Review and accept
        </Button>
        <Button
          variant="secondary"
          style={{ minHeight: theme.space('space.12') }}
          onPress={onLogOut}
        >
          Log out
        </Button>
      </View>
    </GateShell>
  );
}
