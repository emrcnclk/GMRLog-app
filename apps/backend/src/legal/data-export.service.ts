import type {
  DataExportAccount,
  DataExportGamingActivity,
  DataExportOptional,
  DataExportResponse,
  DataExportSocial,
  DataExportTechnical,
  LegalDocumentId,
  LegalLocale,
} from '@gmrlog/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

/**
 * 12.5 — self-serve GDPR Art. 15/20 · KVKK Art. 11 export.
 *
 * One player's data, in the five categories `docs/11_SECURITY/PRIVACY_POLICY.md`
 * names (account, gaming activity, social, technical, optional) rather than a
 * raw table dump — the categories are what the policy already promised, so
 * they are the contract this reads against, not an implementation detail.
 *
 * Soft-deleted content (a withdrawn review, post, comment, collection or tier
 * list) is excluded: the player already asked GMRLog to stop keeping it, and
 * an export that resurrected it would contradict that.
 *
 * Direct `PrismaService` reads rather than the repository layer other legal
 * services use — this fans out across ~20 tables for one read-only snapshot,
 * and a repository interface per table would be a lot of indirection for a
 * query that exists in exactly one place.
 */
@Injectable()
export class DataExportService {
  constructor(private readonly prisma: PrismaService) {}

  async buildExport(userId: string): Promise<DataExportResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null) {
      throw new NotFoundException('Account not found');
    }

    const [
      authCredentials,
      consents,
      settings,
      libraryEntries,
      reviews,
      posts,
      comments,
      reactions,
      collections,
      tierLists,
      quotes,
      communityMemberships,
      eventParticipations,
      achievementProgress,
      following,
      followers,
      friendRequestsSent,
      friendRequestsReceived,
      friendshipsLow,
      friendshipsHigh,
      blocks,
      mutes,
      messagesSent,
      sessions,
      auditLogEntries,
      reportsFiled,
      connectedAccounts,
      integrations,
    ] = await Promise.all([
      this.prisma.authCredential.findMany({ where: { userId } }),
      this.prisma.userConsent.findMany({ where: { userId }, orderBy: { decidedAt: 'desc' } }),
      this.prisma.userSettings.findUnique({ where: { userId } }),
      this.prisma.libraryEntry.findMany({ where: { userId } }),
      this.prisma.review.findMany({ where: { authorId: userId, deletedAt: null } }),
      this.prisma.post.findMany({ where: { authorId: userId, deletedAt: null } }),
      this.prisma.comment.findMany({ where: { authorId: userId, deletedAt: null } }),
      this.prisma.reaction.findMany({ where: { actorId: userId } }),
      this.prisma.collection.findMany({
        where: { ownerId: userId, deletedAt: null },
        include: { entries: { select: { gameId: true } } },
      }),
      this.prisma.tierList.findMany({ where: { ownerId: userId, deletedAt: null } }),
      this.prisma.quote.findMany({ where: { authorId: userId, deletedAt: null } }),
      this.prisma.communityMember.findMany({ where: { userId } }),
      this.prisma.eventParticipation.findMany({ where: { userId } }),
      this.prisma.achievementProgress.findMany({ where: { userId } }),
      this.prisma.follow.findMany({ where: { followerId: userId } }),
      this.prisma.follow.findMany({ where: { followeeId: userId } }),
      this.prisma.friendRequest.findMany({ where: { senderId: userId } }),
      this.prisma.friendRequest.findMany({ where: { receiverId: userId } }),
      this.prisma.friendship.findMany({ where: { userLowId: userId } }),
      this.prisma.friendship.findMany({ where: { userHighId: userId } }),
      this.prisma.block.findMany({ where: { blockerId: userId } }),
      this.prisma.mute.findMany({ where: { muterId: userId } }),
      this.prisma.message.findMany({ where: { senderId: userId, deletedAt: null } }),
      this.prisma.session.findMany({ where: { userId } }),
      this.prisma.auditLog.findMany({ where: { actorId: userId } }),
      this.prisma.report.findMany({ where: { reporterId: userId } }),
      this.prisma.connectedAccount.findMany({ where: { userId } }),
      this.prisma.userIntegration.findMany({ where: { userId } }),
    ]);

    const gameLogs = await this.prisma.gameLog.findMany({
      where: { libraryEntry: { userId } },
    });

    const passwordCredential = authCredentials.find((c) => c.type === 'password');

    const account: DataExportAccount = {
      handle: user.handle,
      displayName: user.displayName,
      email: passwordCredential?.providerRef ?? null,
      authMethods: authCredentials.map((c) => ({
        type: c.type,
        provider: c.provider,
        createdAt: c.createdAt.toISOString(),
      })),
      birthDate: user.birthDate?.toISOString() ?? null,
      countryCode: user.countryCode,
      language: settings?.locale ?? null,
      createdAt: user.createdAt.toISOString(),
      consents: consents.map((row) => ({
        documentId: row.documentId as LegalDocumentId,
        version: row.version,
        locale: row.locale as LegalLocale,
        decision: row.decision,
        decidedAt: row.decidedAt.toISOString(),
      })),
    };

    const gamingActivity: DataExportGamingActivity = {
      libraryEntries: libraryEntries.map((e) => ({
        gameId: e.gameId,
        status: e.status,
        source: e.source,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
      gameLogs: gameLogs.map((l) => ({
        gameId: libraryEntries.find((e) => e.id === l.libraryEntryId)?.gameId ?? l.libraryEntryId,
        kind: l.kind,
        occurredAt: l.occurredAt.toISOString(),
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        gameId: r.gameId,
        rating: r.rating,
        body: r.body,
        visibility: r.visibility,
        createdAt: r.createdAt.toISOString(),
      })),
      posts: posts.map((p) => ({
        id: p.id,
        body: p.body,
        visibility: p.visibility,
        createdAt: p.createdAt.toISOString(),
      })),
      comments: comments.map((c) => ({
        id: c.id,
        hostType: c.hostType,
        hostId: c.hostId,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
      })),
      reactions: reactions.map((r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        kind: r.kind,
        createdAt: r.createdAt.toISOString(),
      })),
      collections: collections.map((c) => ({
        id: c.id,
        title: c.title,
        visibility: c.visibility,
        gameIds: c.entries.map((e) => e.gameId),
        createdAt: c.createdAt.toISOString(),
      })),
      tierLists: tierLists.map((t) => ({
        id: t.id,
        title: t.title,
        visibility: t.visibility,
        createdAt: t.createdAt.toISOString(),
      })),
      quotes: quotes.map((q) => ({
        id: q.id,
        targetType: q.targetType,
        targetId: q.targetId,
        body: q.body,
        visibility: q.visibility,
        createdAt: q.createdAt.toISOString(),
      })),
      communityMemberships: communityMemberships.map((m) => ({
        communityId: m.communityId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
      eventParticipations: eventParticipations.map((p) => ({
        eventId: p.eventId,
        state: p.state,
        createdAt: p.createdAt.toISOString(),
      })),
      achievementProgress: achievementProgress.map((a) => ({
        achievementId: a.achievementId,
        current: a.current,
        target: a.target,
        state: a.state,
        awardedAt: a.awardedAt?.toISOString() ?? null,
      })),
    };

    const social: DataExportSocial = {
      following: following.map((f) => ({
        userId: f.followeeId,
        createdAt: f.createdAt.toISOString(),
      })),
      followers: followers.map((f) => ({
        userId: f.followerId,
        createdAt: f.createdAt.toISOString(),
      })),
      friendRequestsSent: friendRequestsSent.map((r) => ({
        userId: r.receiverId,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      friendRequestsReceived: friendRequestsReceived.map((r) => ({
        userId: r.senderId,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      friendships: [
        ...friendshipsLow.map((f) => ({ userId: f.userHighId, since: f.createdAt.toISOString() })),
        ...friendshipsHigh.map((f) => ({ userId: f.userLowId, since: f.createdAt.toISOString() })),
      ],
      blocks: blocks.map((b) => ({ userId: b.blockedId, createdAt: b.createdAt.toISOString() })),
      mutes: mutes.map((m) => ({ userId: m.mutedId, createdAt: m.createdAt.toISOString() })),
      messagesSent: messagesSent.map((m) => ({
        conversationId: m.conversationId,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    const technical: DataExportTechnical = {
      sessions: sessions.map((s) => ({
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        revokedAt: s.revokedAt?.toISOString() ?? null,
      })),
      auditLogEntries: auditLogEntries.map((a) => ({
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        at: a.at.toISOString(),
      })),
      reportsFiled: reportsFiled.map((r) => ({
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    const optional: DataExportOptional = {
      bio: user.bio,
      avatarKey: user.avatarKey,
      bannerKey: user.bannerKey,
      firstName: user.firstName,
      lastName: user.lastName,
      connectedAccounts: connectedAccounts.map((c) => ({
        provider: c.provider,
        status: c.status,
        scopes: c.scopes,
        linkedAt: c.linkedAt?.toISOString() ?? null,
      })),
      integrations: integrations.map((i) => ({
        provider: i.provider,
        externalRef: i.externalRef,
        displayName: i.displayName,
        verified: i.verified,
        connectedAt: i.connectedAt.toISOString(),
        disconnectedAt: i.disconnectedAt?.toISOString() ?? null,
      })),
    };

    return {
      format: 'gmrlog.data-export.v1',
      exportedAt: new Date().toISOString(),
      categories: { account, gamingActivity, social, technical, optional },
    };
  }
}
