#!/usr/bin/env python3
"""Generate docs/08_API/COMMUNICATION_API.yaml — Communication Platform SSOT (docs only)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "08_API" / "COMMUNICATION_API.yaml"


def op(
    *,
    summary: str,
    operation_id: str,
    tags: list[str],
    params: list[str] | None = None,
    body: str | None = None,
    responses: dict[str, str],
    security: str | None = "BearerAuth",
    rate: str | None = None,
    status: str | None = None,
    sprint: str | None = None,
    idempotent: bool | None = None,
    description: str | None = None,
) -> str:
    lines: list[str] = []
    lines.append(f"      tags:")
    for t in tags:
        lines.append(f"        - {t}")
    lines.append("")
    lines.append(f"      summary: {summary}")
    lines.append("")
    lines.append(f"      operationId: {operation_id}")
    lines.append("")
    if description:
        lines.append("      description: |")
        for para in description.strip().split("\n"):
            lines.append(f"        {para}")
        lines.append("")
    if security is None:
        lines.append("      security: []")
        lines.append("")
    if rate:
        lines.append(f"      x-rate-limit: {rate}")
        lines.append("")
    if status:
        lines.append(f"      x-gmrlog-status: {status}")
        lines.append("")
    if sprint:
        lines.append(f"      x-gmrlog-sprint: '{sprint}'")
        lines.append("")
    if idempotent is not None:
        lines.append(f"      x-idempotent: {str(idempotent).lower()}")
        lines.append("")
    if params:
        lines.append("      parameters:")
        lines.append("")
        for p in params:
            lines.append(f"        - {p}")
            lines.append("")
    if body:
        lines.append("      requestBody:")
        lines.append("")
        lines.append("        required: true")
        lines.append("")
        lines.append("        content:")
        lines.append("")
        lines.append("          application/json:")
        lines.append("")
        lines.append("            schema:")
        lines.append("")
        lines.append(f"              $ref: '{body}'")
        lines.append("")
    lines.append("      responses:")
    lines.append("")
    for code, desc_or_ref in responses.items():
        lines.append(f'        "{code}":')
        lines.append("")
        if desc_or_ref.startswith("$ref:"):
            lines.append(f"          {desc_or_ref}")
        elif desc_or_ref.startswith("schema:"):
            schema = desc_or_ref.removeprefix("schema:")
            lines.append(f"          description: OK")
            lines.append("")
            lines.append("          content:")
            lines.append("")
            lines.append("            application/json:")
            lines.append("")
            lines.append("              schema:")
            lines.append("")
            lines.append(f"                $ref: '{schema}'")
        else:
            lines.append(f"          description: {desc_or_ref}")
        lines.append("")
    return "\n".join(lines)


def path_block(path: str, methods: dict[str, str]) -> str:
    parts = [f"  {path}:", ""]
    for method, body in methods.items():
        parts.append(f"    {method}:")
        parts.append("")
        parts.append(body)
    parts.append("")
    parts.append("  " + "#" * 80)
    parts.append("")
    return "\n".join(parts)


COMMON_ERR = {
    "401": "$ref: './common/responses.yaml#/components/responses/Unauthorized'",
    "403": "$ref: './common/responses.yaml#/components/responses/Forbidden'",
    "404": "$ref: './common/responses.yaml#/components/responses/NotFound'",
}

P_CONV = "$ref: '#/components/parameters/ConversationId'"
P_MSG = "$ref: '#/components/parameters/MessageId'"
P_GROUP = "$ref: '#/components/parameters/GroupId'"
P_CHANNEL = "$ref: '#/components/parameters/ChannelId'"
P_USER = "$ref: '#/components/parameters/UserId'"
P_CURSOR = "$ref: './common/parameters.yaml#/components/parameters/Cursor'"
P_LIMIT = "$ref: './common/parameters.yaml#/components/parameters/Limit'"


def main() -> None:
    header = '''openapi: 3.1.0

info:

  title: GMRLOG Communication API

  version: 1.0.0

  description: |
    Production OpenAPI contract for the GMRLOG **Communication Platform**.

    **Communication Platform Freeze v1.0** (Sprint 9.0.1). Normative decisions:
    leave ≠ delete, GroupMember→ConversationMember ownership, O(N) cache ban,
    DM block privacy (404), Sprint 9.1 scope lock. See
    `docs/00_PROJECT/COMMUNICATION_PLATFORM_FREEZE_v1.md`.

    This module is the canonical REST owner for conversations, messages, groups,
    channels, reactions, threads, polls, mentions, pins and related engagement.

    It is **not** a narrow "DM-only Messaging" feature — it is the shared
    communication bounded context that future WebSocket, Notification, Feed,
    Search, AI, Community and Indie Hub integrations will consume via events.

    ## Sprint 9.1 normative slice (implement ONLY these)

    Operations tagged `x-gmrlog-sprint: '9.1'` and **not** `x-gmrlog-status: future`:
    list/create/get/patch conversations, leave conversation, list participants,
    list/create/get messages. Create message accepts **TEXT** only (SYSTEM is
    server-emitted). All other paths are non-normative appendix until their sprint.

    ## Implementation status

    OpenAPI-first SSOT. Backend implementation lands in Sprint 9.1+.
    Extensions marked `x-gmrlog-status: future` require Database Freeze
    follow-ups before shipping.

    ## Database Freeze alignment

    Present today: `Conversation`, `ConversationMember`, `Message`,
    `MessageRead`, `MessageAttachment`, `TypingStatus`.

    Future schema (documented here, not yet in DB Freeze): Groups, Channels,
    Threads (`parentMessageId`), Pins, Polls, Voice rooms, Forward graph.

    ## Realtime

    WebSocket / typing / presence / delivery ACKs are **out of this REST file**.
    See `docs/06_BACKEND/WEBSOCKET_ARCHITECTURE.md` and Sprint 9.4–9.5.

servers:

  - url: https://api.gmrlog.com/api/v1

    description: Production

  - url: https://staging-api.gmrlog.com/api/v1

    description: Staging

  - url: http://localhost:4000/api/v1

    description: Local Development

tags:

  - name: Conversations
    description: Direct and group-backed conversation inbox

  - name: Participants
    description: Conversation membership

  - name: Messages
    description: Message CRUD, rich types, search

  - name: ReadReceipts
    description: Message read state (Freeze MessageRead)

  - name: Reactions
    description: Likes and emoji reactions

  - name: Threads
    description: Reply threads (future Freeze column)

  - name: Groups
    description: Public / private / invite-only communities

  - name: GroupMembers
    description: Owner / moderator / member roles

  - name: Channels
    description: Topic channels under a group

  - name: Polls
    description: In-conversation polls

  - name: Mentions
    description: Mention inbox and per-message mentions

  - name: Pins
    description: Pinned messages

  - name: Bookmarks
    description: Saved messages

  - name: Attachments
    description: Media attachments (API surface future)

  - name: VoiceRooms
    description: Voice channels (future)

security:

  - BearerAuth: []

paths:

'''

    paths: list[str] = []

    # Conversations
    paths.append(
        path_block(
            "/conversations",
            {
                "get": op(
                    summary="List conversations",
                    operation_id="listConversations",
                    tags=["Conversations"],
                    params=[P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/ConversationPage",
                        "401": COMMON_ERR["401"],
                    },
                    rate="180/min",
                    sprint="9.1",
                    description="Inbox for the authenticated user (participant only).",
                ),
                "post": op(
                    summary="Create conversation",
                    operation_id="createConversation",
                    tags=["Conversations"],
                    body="#/components/schemas/CreateConversationRequest",
                    responses={
                        "201": "schema:#/components/schemas/Conversation",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        "401": COMMON_ERR["401"],
                        "404": COMMON_ERR["404"],
                    },
                    rate="30/min",
                    sprint="9.1",
                    idempotent=True,
                    description=(
                        "Creates a DIRECT conversation (or resolves existing DM pair). "
                        "Group chats are created via Groups/Channels (9.3).\n"
                        "\n"
                        "Privacy: if either party has a Social block (either direction), "
                        "respond **404** (same as non-participant private resource) — never "
                        "403 that reveals a block. Friend-gate is out of scope for 9.1; "
                        "rate limits are the primary spam control."
                    ),
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}",
            {
                "get": op(
                    summary="Get conversation",
                    operation_id="getConversation",
                    tags=["Conversations"],
                    params=[P_CONV],
                    responses={
                        "200": "schema:#/components/schemas/Conversation",
                        **COMMON_ERR,
                    },
                    rate="180/min",
                    sprint="9.1",
                ),
                "patch": op(
                    summary="Update conversation",
                    operation_id="updateConversation",
                    tags=["Conversations"],
                    params=[P_CONV],
                    body="#/components/schemas/UpdateConversationRequest",
                    responses={
                        "200": "schema:#/components/schemas/Conversation",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        **COMMON_ERR,
                    },
                    rate="60/min",
                    sprint="9.1",
                    description="Participant may update title/archive flags where permitted.",
                ),
                "delete": op(
                    summary="Leave conversation",
                    operation_id="leaveConversation",
                    tags=["Conversations"],
                    params=[P_CONV],
                    responses={
                        "204": "Left (ConversationMember.leftAt set)",
                        **COMMON_ERR,
                    },
                    rate="60/min",
                    sprint="9.1",
                    description=(
                        "**Leave only** — never destroys the Conversation aggregate or messages.\n"
                        "\n"
                        "Sets `ConversationMember.leftAt` for the caller. Emits "
                        "`conversation.participant.left.v1` (not `conversation.deleted.v1`).\n"
                        "\n"
                        "Archive/mute are **PATCH** (`archived` / `muted`). Hard-delete of a "
                        "conversation is out of scope for 9.1–9.6 (no public destroy endpoint)."
                    ),
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/participants",
            {
                "get": op(
                    summary="List participants",
                    operation_id="listConversationParticipants",
                    tags=["Participants"],
                    params=[P_CONV, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/ConversationParticipantPage",
                        **COMMON_ERR,
                    },
                    sprint="9.1",
                ),
                "post": op(
                    summary="Add participant",
                    operation_id="addConversationParticipant",
                    tags=["Participants"],
                    params=[P_CONV],
                    body="#/components/schemas/AddParticipantRequest",
                    responses={
                        "201": "schema:#/components/schemas/ConversationParticipant",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        **COMMON_ERR,
                    },
                    rate="30/min",
                    status="future",
                    sprint="9.3",
                    description="Group-backed conversations only. DIRECT is fixed at two members.",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/participants/{userId}",
            {
                "delete": op(
                    summary="Remove participant",
                    operation_id="removeConversationParticipant",
                    tags=["Participants"],
                    params=[P_CONV, P_USER],
                    responses={"204": "Removed", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    # Messages
    paths.append(
        path_block(
            "/conversations/{conversationId}/messages",
            {
                "get": op(
                    summary="List messages",
                    operation_id="listMessages",
                    tags=["Messages"],
                    params=[P_CONV, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/MessagePage",
                        **COMMON_ERR,
                    },
                    rate="180/min",
                    sprint="9.1",
                    description="Cursor page, newest first. Soft-deleted messages omitted unless `includeDeleted` (moderator).",
                ),
                "post": op(
                    summary="Send message",
                    operation_id="sendMessage",
                    tags=["Messages"],
                    params=[P_CONV],
                    body="#/components/schemas/CreateMessageRequest",
                    responses={
                        "201": "schema:#/components/schemas/Message",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        **COMMON_ERR,
                    },
                    rate="120/min",
                    sprint="9.1",
                    idempotent=True,
                    description=(
                        "Requires write permission (active participant; not blocked).\n"
                        "\n"
                        "Sprint **9.1**: `messageType` MUST be `TEXT` only. `SYSTEM` is "
                        "server-emitted. Rich card types and media types are non-normative "
                        "until later sprints (see MessageType description).\n"
                        "\n"
                        "Idempotency-Key header recommended."
                    ),
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/search",
            {
                "get": op(
                    summary="Search messages in conversation",
                    operation_id="searchConversationMessages",
                    tags=["Messages"],
                    params=[
                        P_CONV,
                        P_CURSOR,
                        P_LIMIT,
                        "name: q\n          in: query\n          required: true\n          schema:\n            type: string\n            minLength: 1\n            maxLength: 200",
                    ],
                    responses={
                        "200": "schema:#/components/schemas/MessagePage",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.6",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/read",
            {
                "post": op(
                    summary="Mark messages read",
                    operation_id="markMessagesRead",
                    tags=["ReadReceipts"],
                    params=[P_CONV],
                    body="#/components/schemas/MarkMessagesReadRequest",
                    responses={"204": "Read state updated", **COMMON_ERR},
                    rate="120/min",
                    sprint="9.5",
                    idempotent=True,
                    description="Writes MessageRead rows and updates ConversationMember.lastReadAt.",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}",
            {
                "get": op(
                    summary="Get message",
                    operation_id="getMessage",
                    tags=["Messages"],
                    params=[P_CONV, P_MSG],
                    responses={
                        "200": "schema:#/components/schemas/Message",
                        **COMMON_ERR,
                    },
                    sprint="9.1",
                ),
                "patch": op(
                    summary="Edit message",
                    operation_id="updateMessage",
                    tags=["Messages"],
                    params=[P_CONV, P_MSG],
                    body="#/components/schemas/UpdateMessageRequest",
                    responses={
                        "200": "schema:#/components/schemas/Message",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        **COMMON_ERR,
                    },
                    rate="60/min",
                    sprint="9.2",
                    description="Sender only within edit window. Emits message.updated.v1.",
                ),
                "delete": op(
                    summary="Soft-delete message",
                    operation_id="deleteMessage",
                    tags=["Messages"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Deleted", **COMMON_ERR},
                    rate="60/min",
                    sprint="9.2",
                    description="Sets Message.deletedAt. Sender or moderator.",
                ),
            },
        )
    )

    # Like / reactions / thread / pin / bookmark / report / mentions / forward
    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/like",
            {
                "post": op(
                    summary="Like message",
                    operation_id="likeMessage",
                    tags=["Reactions"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Liked", **COMMON_ERR},
                    rate="120/min",
                    sprint="9.2",
                    idempotent=True,
                ),
                "delete": op(
                    summary="Unlike message",
                    operation_id="unlikeMessage",
                    tags=["Reactions"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Unliked", **COMMON_ERR},
                    rate="120/min",
                    sprint="9.2",
                    idempotent=True,
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/reactions",
            {
                "get": op(
                    summary="List reactions",
                    operation_id="listMessageReactions",
                    tags=["Reactions"],
                    params=[P_CONV, P_MSG, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/MessageReactionPage",
                        **COMMON_ERR,
                    },
                    sprint="9.2",
                ),
                "post": op(
                    summary="Add emoji reaction",
                    operation_id="addMessageReaction",
                    tags=["Reactions"],
                    params=[P_CONV, P_MSG],
                    body="#/components/schemas/CreateMessageReactionRequest",
                    responses={
                        "201": "schema:#/components/schemas/MessageReaction",
                        **COMMON_ERR,
                    },
                    rate="120/min",
                    sprint="9.2",
                    idempotent=True,
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/reactions/{reactionId}",
            {
                "delete": op(
                    summary="Remove reaction",
                    operation_id="removeMessageReaction",
                    tags=["Reactions"],
                    params=[
                        P_CONV,
                        P_MSG,
                        "$ref: '#/components/parameters/ReactionId'",
                    ],
                    responses={"204": "Removed", **COMMON_ERR},
                    sprint="9.2",
                    idempotent=True,
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/replies",
            {
                "post": op(
                    summary="Reply in thread",
                    operation_id="replyToMessage",
                    tags=["Threads"],
                    params=[P_CONV, P_MSG],
                    body="#/components/schemas/CreateMessageRequest",
                    responses={
                        "201": "schema:#/components/schemas/Message",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                    description="Requires parentMessageId Freeze column.",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/thread",
            {
                "get": op(
                    summary="Get thread replies",
                    operation_id="getMessageThread",
                    tags=["Threads"],
                    params=[P_CONV, P_MSG, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/MessagePage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/pin",
            {
                "post": op(
                    summary="Pin message",
                    operation_id="pinMessage",
                    tags=["Pins"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Pinned", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
                "delete": op(
                    summary="Unpin message",
                    operation_id="unpinMessage",
                    tags=["Pins"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Unpinned", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                    idempotent=True,
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/pins",
            {
                "get": op(
                    summary="List pinned messages",
                    operation_id="listPinnedMessages",
                    tags=["Pins"],
                    params=[P_CONV, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/PinnedMessagePage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/bookmark",
            {
                "post": op(
                    summary="Bookmark message",
                    operation_id="bookmarkMessage",
                    tags=["Bookmarks"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Bookmarked", **COMMON_ERR},
                    sprint="9.2",
                    idempotent=True,
                ),
                "delete": op(
                    summary="Remove bookmark",
                    operation_id="unbookmarkMessage",
                    tags=["Bookmarks"],
                    params=[P_CONV, P_MSG],
                    responses={"204": "Removed", **COMMON_ERR},
                    sprint="9.2",
                    idempotent=True,
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/messages/bookmarks",
            {
                "get": op(
                    summary="List bookmarked messages",
                    operation_id="listMessageBookmarks",
                    tags=["Bookmarks"],
                    params=[P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/MessagePage",
                        "401": COMMON_ERR["401"],
                    },
                    sprint="9.2",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/report",
            {
                "post": op(
                    summary="Report message",
                    operation_id="reportMessage",
                    tags=["Messages"],
                    params=[P_CONV, P_MSG],
                    body="#/components/schemas/ReportMessageRequest",
                    responses={
                        "201": "schema:#/components/schemas/MessageReportReceipt",
                        **COMMON_ERR,
                    },
                    rate="10/min",
                    sprint="9.2",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/messages/mentions",
            {
                "get": op(
                    summary="List mentions for me",
                    operation_id="listMyMentions",
                    tags=["Mentions"],
                    params=[P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/MentionPage",
                        "401": COMMON_ERR["401"],
                    },
                    sprint="9.2",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/forward",
            {
                "post": op(
                    summary="Forward message",
                    operation_id="forwardMessage",
                    tags=["Messages"],
                    params=[P_CONV, P_MSG],
                    body="#/components/schemas/ForwardMessageRequest",
                    responses={
                        "201": "schema:#/components/schemas/Message",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.6",
                ),
            },
        )
    )

    # Polls
    paths.append(
        path_block(
            "/conversations/{conversationId}/polls",
            {
                "post": op(
                    summary="Create poll",
                    operation_id="createPoll",
                    tags=["Polls"],
                    params=[P_CONV],
                    body="#/components/schemas/CreatePollRequest",
                    responses={
                        "201": "schema:#/components/schemas/Poll",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/polls/{pollId}",
            {
                "get": op(
                    summary="Get poll",
                    operation_id="getPoll",
                    tags=["Polls"],
                    params=[P_CONV, "$ref: '#/components/parameters/PollId'"],
                    responses={"200": "schema:#/components/schemas/Poll", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/conversations/{conversationId}/polls/{pollId}/votes",
            {
                "post": op(
                    summary="Cast poll vote",
                    operation_id="castPollVote",
                    tags=["Polls"],
                    params=[P_CONV, "$ref: '#/components/parameters/PollId'"],
                    body="#/components/schemas/CastPollVoteRequest",
                    responses={"204": "Vote recorded", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                    idempotent=True,
                ),
                "delete": op(
                    summary="Retract poll vote",
                    operation_id="retractPollVote",
                    tags=["Polls"],
                    params=[P_CONV, "$ref: '#/components/parameters/PollId'"],
                    responses={"204": "Vote retracted", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                    idempotent=True,
                ),
            },
        )
    )

    # Groups
    paths.append(
        path_block(
            "/groups",
            {
                "get": op(
                    summary="List my groups",
                    operation_id="listMyGroups",
                    tags=["Groups"],
                    params=[P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/GroupPage",
                        "401": COMMON_ERR["401"],
                    },
                    status="future",
                    sprint="9.3",
                ),
                "post": op(
                    summary="Create group",
                    operation_id="createGroup",
                    tags=["Groups"],
                    body="#/components/schemas/CreateGroupRequest",
                    responses={
                        "201": "schema:#/components/schemas/Group",
                        "400": "$ref: './common/responses.yaml#/components/responses/ValidationError'",
                        "401": COMMON_ERR["401"],
                    },
                    rate="10/min",
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/discover",
            {
                "get": op(
                    summary="Discover public groups",
                    operation_id="discoverGroups",
                    tags=["Groups"],
                    params=[P_CURSOR, P_LIMIT],
                    security=None,
                    responses={
                        "200": "schema:#/components/schemas/GroupPage",
                    },
                    status="future",
                    sprint="9.3",
                    description="Public visibility only. Invite-only and private groups are never listed.",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}",
            {
                "get": op(
                    summary="Get group",
                    operation_id="getGroup",
                    tags=["Groups"],
                    params=[P_GROUP],
                    responses={"200": "schema:#/components/schemas/Group", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
                "patch": op(
                    summary="Update group",
                    operation_id="updateGroup",
                    tags=["Groups"],
                    params=[P_GROUP],
                    body="#/components/schemas/UpdateGroupRequest",
                    responses={"200": "schema:#/components/schemas/Group", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
                "delete": op(
                    summary="Delete group",
                    operation_id="deleteGroup",
                    tags=["Groups"],
                    params=[P_GROUP],
                    responses={"204": "Deleted", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/join",
            {
                "post": op(
                    summary="Join group",
                    operation_id="joinGroup",
                    tags=["Groups"],
                    params=[P_GROUP],
                    responses={"204": "Joined", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                    description="PUBLIC groups only. PRIVATE/INVITE_ONLY return 403.",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/leave",
            {
                "post": op(
                    summary="Leave group",
                    operation_id="leaveGroup",
                    tags=["Groups"],
                    params=[P_GROUP],
                    responses={"204": "Left", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/invites",
            {
                "get": op(
                    summary="List invites",
                    operation_id="listGroupInvites",
                    tags=["Groups"],
                    params=[P_GROUP, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/GroupInvitePage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
                "post": op(
                    summary="Create invite",
                    operation_id="createGroupInvite",
                    tags=["Groups"],
                    params=[P_GROUP],
                    body="#/components/schemas/CreateGroupInviteRequest",
                    responses={
                        "201": "schema:#/components/schemas/GroupInvite",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/invites/{token}/accept",
            {
                "post": op(
                    summary="Accept group invite",
                    operation_id="acceptGroupInvite",
                    tags=["Groups"],
                    params=[
                        "name: token\n          in: path\n          required: true\n          schema:\n            type: string"
                    ],
                    responses={"204": "Accepted", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/members",
            {
                "get": op(
                    summary="List group members",
                    operation_id="listGroupMembers",
                    tags=["GroupMembers"],
                    params=[P_GROUP, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/GroupMemberPage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/members/{userId}",
            {
                "patch": op(
                    summary="Update member role",
                    operation_id="updateGroupMemberRole",
                    tags=["GroupMembers"],
                    params=[P_GROUP, P_USER],
                    body="#/components/schemas/UpdateGroupMemberRoleRequest",
                    responses={
                        "200": "schema:#/components/schemas/GroupMember",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
                "delete": op(
                    summary="Remove member",
                    operation_id="removeGroupMember",
                    tags=["GroupMembers"],
                    params=[P_GROUP, P_USER],
                    responses={"204": "Removed", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    # Channels
    paths.append(
        path_block(
            "/groups/{groupId}/channels",
            {
                "get": op(
                    summary="List channels",
                    operation_id="listChannels",
                    tags=["Channels"],
                    params=[P_GROUP, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/ChannelPage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
                "post": op(
                    summary="Create channel",
                    operation_id="createChannel",
                    tags=["Channels"],
                    params=[P_GROUP],
                    body="#/components/schemas/CreateChannelRequest",
                    responses={
                        "201": "schema:#/components/schemas/Channel",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/channels/{channelId}",
            {
                "get": op(
                    summary="Get channel",
                    operation_id="getChannel",
                    tags=["Channels"],
                    params=[P_GROUP, P_CHANNEL],
                    responses={
                        "200": "schema:#/components/schemas/Channel",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
                "patch": op(
                    summary="Update channel",
                    operation_id="updateChannel",
                    tags=["Channels"],
                    params=[P_GROUP, P_CHANNEL],
                    body="#/components/schemas/UpdateChannelRequest",
                    responses={
                        "200": "schema:#/components/schemas/Channel",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                ),
                "delete": op(
                    summary="Delete channel",
                    operation_id="deleteChannel",
                    tags=["Channels"],
                    params=[P_GROUP, P_CHANNEL],
                    responses={"204": "Deleted", **COMMON_ERR},
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/channels/{channelId}/messages",
            {
                "get": op(
                    summary="List channel messages",
                    operation_id="listChannelMessages",
                    tags=["Channels"],
                    params=[P_GROUP, P_CHANNEL, P_CURSOR, P_LIMIT],
                    responses={
                        "200": "schema:#/components/schemas/MessagePage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.3",
                    description="Alias over the channel's linked Conversation message stream.",
                ),
                "post": op(
                    summary="Send channel message",
                    operation_id="sendChannelMessage",
                    tags=["Channels"],
                    params=[P_GROUP, P_CHANNEL],
                    body="#/components/schemas/CreateMessageRequest",
                    responses={
                        "201": "schema:#/components/schemas/Message",
                        **COMMON_ERR,
                    },
                    rate="120/min",
                    status="future",
                    sprint="9.3",
                ),
            },
        )
    )

    # Attachments + voice (future)
    paths.append(
        path_block(
            "/conversations/{conversationId}/messages/{messageId}/attachments",
            {
                "get": op(
                    summary="List attachments",
                    operation_id="listMessageAttachments",
                    tags=["Attachments"],
                    params=[P_CONV, P_MSG],
                    responses={
                        "200": "schema:#/components/schemas/MessageAttachmentPage",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.4",
                ),
                "post": op(
                    summary="Attach media to message",
                    operation_id="addMessageAttachment",
                    tags=["Attachments"],
                    params=[P_CONV, P_MSG],
                    body="#/components/schemas/CreateMessageAttachmentRequest",
                    responses={
                        "201": "schema:#/components/schemas/MessageAttachment",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.4",
                    description="Prefer media presign pipeline. Freeze table MessageAttachment exists.",
                ),
            },
        )
    )

    paths.append(
        path_block(
            "/groups/{groupId}/channels/{channelId}/voice-room",
            {
                "get": op(
                    summary="Get voice room",
                    operation_id="getVoiceRoom",
                    tags=["VoiceRooms"],
                    params=[P_GROUP, P_CHANNEL],
                    responses={
                        "200": "schema:#/components/schemas/VoiceRoom",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.4",
                ),
                "post": op(
                    summary="Open voice room",
                    operation_id="openVoiceRoom",
                    tags=["VoiceRooms"],
                    params=[P_GROUP, P_CHANNEL],
                    responses={
                        "201": "schema:#/components/schemas/VoiceRoom",
                        **COMMON_ERR,
                    },
                    status="future",
                    sprint="9.4",
                ),
                "delete": op(
                    summary="Close voice room",
                    operation_id="closeVoiceRoom",
                    tags=["VoiceRooms"],
                    params=[P_GROUP, P_CHANNEL],
                    responses={"204": "Closed", **COMMON_ERR},
                    status="future",
                    sprint="9.4",
                ),
            },
        )
    )

    components = r'''
components:

  securitySchemes:

    BearerAuth:

      $ref: './common/security.yaml#/components/securitySchemes/BearerAuth'

  parameters:

    ConversationId:

      name: conversationId

      in: path

      required: true

      schema:

        type: string

        format: uuid

    MessageId:

      name: messageId

      in: path

      required: true

      schema:

        type: string

        format: uuid

    GroupId:

      name: groupId

      in: path

      required: true

      schema:

        type: string

        format: uuid

    ChannelId:

      name: channelId

      in: path

      required: true

      schema:

        type: string

        format: uuid

    UserId:

      name: userId

      in: path

      required: true

      schema:

        type: string

        format: uuid

    ReactionId:

      name: reactionId

      in: path

      required: true

      schema:

        type: string

        format: uuid

    PollId:

      name: pollId

      in: path

      required: true

      schema:

        type: string

        format: uuid

  schemas:

    ConversationType:

      type: string

      enum: [DIRECT, GROUP]

    MessageType:

      type: string

      description: |
        Full platform vocabulary (bible + future appendix).

        **Database Freeze values (shippable when attachment/media paths exist):**
        TEXT, IMAGE, GIF, VIDEO, GAME_SHARE, SYSTEM.

        **Sprint 9.1 normative write set:** TEXT only (`SYSTEM` is server-emitted).
        Clients MUST NOT send Freeze media/share types or rich-card types in 9.1.

        **Rich / future cards (non-normative until engagement/share sprints):**
        GAME_CARD, REVIEW_SHARE, COLLECTION_SHARE, LIST_SHARE, TIERLIST_SHARE,
        GAME_LOG_SHARE, ACHIEVEMENT_SHARE, DEVELOPER_POST, BROWSER_GAME, POLL, MEDIA.

        Rich cards reference foreign aggregate ids only — Communication never owns
        Review/List/Collection/TierList domain logic.
      enum:
        - TEXT
        - IMAGE
        - GIF
        - VIDEO
        - GAME_SHARE
        - SYSTEM
        - GAME_CARD
        - REVIEW_SHARE
        - COLLECTION_SHARE
        - LIST_SHARE
        - TIERLIST_SHARE
        - GAME_LOG_SHARE
        - ACHIEVEMENT_SHARE
        - DEVELOPER_POST
        - BROWSER_GAME
        - POLL
        - MEDIA
      x-gmrlog-sprint-9-1-write: [TEXT]

    GroupVisibility:

      type: string

      enum: [PUBLIC, PRIVATE, INVITE_ONLY, HIDDEN]

      x-gmrlog-status: future

    GroupMemberRole:

      type: string

      enum: [OWNER, MODERATOR, MEMBER]

      x-gmrlog-status: future

    ChannelKind:

      type: string

      enum: [GENERAL, ANNOUNCEMENTS, MEDIA, STRATEGY, LFG, VOICE]

      x-gmrlog-status: future

    Conversation:

      type: object

      required: [id, type, createdAt, updatedAt, participants]

      properties:

        id:

          type: string

          format: uuid

        type:

          $ref: '#/components/schemas/ConversationType'

        title:

          type: string

          nullable: true

          maxLength: 120

        groupId:

          type: string

          format: uuid

          nullable: true

          x-gmrlog-status: future

        channelId:

          type: string

          format: uuid

          nullable: true

          x-gmrlog-status: future

        participants:

          type: array

          items:

            $ref: '#/components/schemas/ConversationParticipant'

        lastMessage:

          allOf:

            - $ref: '#/components/schemas/Message'

          nullable: true

        unreadCount:

          type: integer

          minimum: 0

        archived:

          type: boolean

          default: false

        muted:

          type: boolean

          default: false

        createdAt:

          type: string

          format: date-time

        updatedAt:

          type: string

          format: date-time

    ConversationPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/Conversation'

    ConversationParticipant:

      type: object

      required: [userId, joinedAt]

      properties:

        userId:

          type: string

          format: uuid

        user:

          $ref: './common/schemas/user-summary.yaml#/components/schemas/UserSummary'

        joinedAt:

          type: string

          format: date-time

        leftAt:

          type: string

          format: date-time

          nullable: true

        lastReadAt:

          type: string

          format: date-time

          nullable: true

    ConversationParticipantPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/ConversationParticipant'

    CreateConversationRequest:

      type: object

      required: [participantIds]

      properties:

        participantIds:

          type: array

          minItems: 1

          maxItems: 1

          description: Other user id for DIRECT (caller implied).

          items:

            type: string

            format: uuid

        title:

          type: string

          maxLength: 120

        initialMessage:

          $ref: '#/components/schemas/CreateMessageRequest'

      example:

        participantIds:
          - "11111111-1111-4111-8111-111111111111"

        initialMessage:

          body: "Hey — want to co-op tonight?"

          messageType: TEXT

    UpdateConversationRequest:

      type: object

      properties:

        title:

          type: string

          maxLength: 120

          nullable: true

        archived:

          type: boolean

        muted:

          type: boolean

    AddParticipantRequest:

      type: object

      required: [userId]

      properties:

        userId:

          type: string

          format: uuid

      x-gmrlog-status: future

    Message:

      type: object

      required: [id, conversationId, senderId, messageType, createdAt, updatedAt]

      properties:

        id:

          type: string

          format: uuid

        conversationId:

          type: string

          format: uuid

        senderId:

          type: string

          format: uuid

        sender:

          $ref: './common/schemas/user-summary.yaml#/components/schemas/UserSummary'

        messageType:

          $ref: '#/components/schemas/MessageType'

        body:

          type: string

          nullable: true

          maxLength: 8000

        parentMessageId:

          type: string

          format: uuid

          nullable: true

          x-gmrlog-status: future

        richPayload:

          type: object

          additionalProperties: true

          nullable: true

          description: Typed card payload for share message types (gameId, reviewId, …).

        likeCount:

          type: integer

          minimum: 0

          default: 0

        reactionCount:

          type: integer

          minimum: 0

          default: 0

        replyCount:

          type: integer

          minimum: 0

          default: 0

        pinned:

          type: boolean

          default: false

        edited:

          type: boolean

          default: false

        deletedAt:

          type: string

          format: date-time

          nullable: true

        createdAt:

          type: string

          format: date-time

        updatedAt:

          type: string

          format: date-time

      example:

        id: "22222222-2222-4222-8222-222222222222"

        conversationId: "33333333-3333-4333-8333-333333333333"

        senderId: "11111111-1111-4111-8111-111111111111"

        messageType: TEXT

        body: "gg"

        likeCount: 0

        reactionCount: 0

        replyCount: 0

        pinned: false

        edited: false

        deletedAt: null

        createdAt: "2026-07-18T01:00:00.000Z"

        updatedAt: "2026-07-18T01:00:00.000Z"

    MessagePage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/Message'

    CreateMessageRequest:

      type: object

      properties:

        body:

          type: string

          maxLength: 8000

        messageType:

          $ref: '#/components/schemas/MessageType'

          default: TEXT

          description: |
            Sprint 9.1 writes: TEXT only. Other enum values are rejected with 400
            until their sprint enables them.

        richPayload:

          type: object

          additionalProperties: true

          description: |
            Reserved for rich cards. MUST be omitted/ignored in Sprint 9.1.
          x-gmrlog-status: future

        parentMessageId:

          type: string

          format: uuid

          x-gmrlog-status: future

        clientMessageId:

          type: string

          format: uuid

          description: Client idempotency token (optional if Idempotency-Key header set).

      example:

        body: "Hey — want to co-op tonight?"

        messageType: TEXT

    UpdateMessageRequest:

      type: object

      required: [body]

      properties:

        body:

          type: string

          minLength: 1

          maxLength: 8000

    MarkMessagesReadRequest:

      type: object

      properties:

        upToMessageId:

          type: string

          format: uuid

        messageIds:

          type: array

          items:

            type: string

            format: uuid

    MessageReaction:

      type: object

      required: [id, messageId, userId, emoji, createdAt]

      properties:

        id:

          type: string

          format: uuid

        messageId:

          type: string

          format: uuid

        userId:

          type: string

          format: uuid

        emoji:

          type: string

          minLength: 1

          maxLength: 32

        createdAt:

          type: string

          format: date-time

    MessageReactionPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/MessageReaction'

    CreateMessageReactionRequest:

      type: object

      required: [emoji]

      properties:

        emoji:

          type: string

          minLength: 1

          maxLength: 32

    PinnedMessage:

      type: object

      required: [messageId, pinnedAt, pinnedBy]

      properties:

        messageId:

          type: string

          format: uuid

        message:

          $ref: '#/components/schemas/Message'

        pinnedAt:

          type: string

          format: date-time

        pinnedBy:

          type: string

          format: uuid

      x-gmrlog-status: future

    PinnedMessagePage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/PinnedMessage'

      x-gmrlog-status: future

    ReportMessageRequest:

      type: object

      required: [reasonId]

      properties:

        reasonId:

          type: string

          format: uuid

        description:

          type: string

          maxLength: 2000

    MessageReportReceipt:

      type: object

      required: [reportId, createdAt]

      properties:

        reportId:

          type: string

          format: uuid

        createdAt:

          type: string

          format: date-time

    Mention:

      type: object

      required: [id, messageId, mentionedUserId, createdAt]

      properties:

        id:

          type: string

          format: uuid

        messageId:

          type: string

          format: uuid

        conversationId:

          type: string

          format: uuid

        mentionedUserId:

          type: string

          format: uuid

        createdAt:

          type: string

          format: date-time

    MentionPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/Mention'

    ForwardMessageRequest:

      type: object

      required: [targetConversationId]

      properties:

        targetConversationId:

          type: string

          format: uuid

        note:

          type: string

          maxLength: 500

      x-gmrlog-status: future

    Poll:

      type: object

      required: [id, conversationId, question, options, createdAt]

      properties:

        id:

          type: string

          format: uuid

        conversationId:

          type: string

          format: uuid

        messageId:

          type: string

          format: uuid

          nullable: true

        question:

          type: string

          maxLength: 500

        options:

          type: array

          minItems: 2

          maxItems: 10

          items:

            $ref: '#/components/schemas/PollOption'

        endsAt:

          type: string

          format: date-time

          nullable: true

        createdAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    PollOption:

      type: object

      required: [id, label, voteCount]

      properties:

        id:

          type: string

          format: uuid

        label:

          type: string

          maxLength: 200

        voteCount:

          type: integer

          minimum: 0

      x-gmrlog-status: future

    CreatePollRequest:

      type: object

      required: [question, options]

      properties:

        question:

          type: string

          minLength: 1

          maxLength: 500

        options:

          type: array

          minItems: 2

          maxItems: 10

          items:

            type: string

            minLength: 1

            maxLength: 200

        endsAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    CastPollVoteRequest:

      type: object

      required: [optionId]

      properties:

        optionId:

          type: string

          format: uuid

      x-gmrlog-status: future

    Group:

      type: object

      required: [id, name, visibility, createdAt, updatedAt]

      properties:

        id:

          type: string

          format: uuid

        name:

          type: string

          maxLength: 80

        slug:

          type: string

          maxLength: 80

        description:

          type: string

          maxLength: 2000

          nullable: true

        rules:

          type: string

          maxLength: 8000

          nullable: true

        visibility:

          $ref: '#/components/schemas/GroupVisibility'

        avatarUrl:

          type: string

          format: uri

          nullable: true

        bannerUrl:

          type: string

          format: uri

          nullable: true

        tags:

          type: array

          items:

            type: string

          maxItems: 20

        memberCount:

          type: integer

          minimum: 0

        createdAt:

          type: string

          format: date-time

        updatedAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    GroupPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/Group'

      x-gmrlog-status: future

    CreateGroupRequest:

      type: object

      required: [name, visibility]

      properties:

        name:

          type: string

          minLength: 2

          maxLength: 80

        description:

          type: string

          maxLength: 2000

        visibility:

          $ref: '#/components/schemas/GroupVisibility'

        tags:

          type: array

          items:

            type: string

      x-gmrlog-status: future

    UpdateGroupRequest:

      type: object

      properties:

        name:

          type: string

          maxLength: 80

        description:

          type: string

          maxLength: 2000

          nullable: true

        rules:

          type: string

          maxLength: 8000

          nullable: true

        visibility:

          $ref: '#/components/schemas/GroupVisibility'

        avatarUrl:

          type: string

          format: uri

          nullable: true

        bannerUrl:

          type: string

          format: uri

          nullable: true

        tags:

          type: array

          items:

            type: string

      x-gmrlog-status: future

    GroupMember:

      type: object

      required: [userId, role, joinedAt]

      properties:

        userId:

          type: string

          format: uuid

        user:

          $ref: './common/schemas/user-summary.yaml#/components/schemas/UserSummary'

        role:

          $ref: '#/components/schemas/GroupMemberRole'

        joinedAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    GroupMemberPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/GroupMember'

      x-gmrlog-status: future

    UpdateGroupMemberRoleRequest:

      type: object

      required: [role]

      properties:

        role:

          $ref: '#/components/schemas/GroupMemberRole'

      x-gmrlog-status: future

    GroupInvite:

      type: object

      required: [id, groupId, token, createdAt, expiresAt]

      properties:

        id:

          type: string

          format: uuid

        groupId:

          type: string

          format: uuid

        token:

          type: string

        createdAt:

          type: string

          format: date-time

        expiresAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    GroupInvitePage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/GroupInvite'

      x-gmrlog-status: future

    CreateGroupInviteRequest:

      type: object

      properties:

        expiresInHours:

          type: integer

          minimum: 1

          maximum: 720

          default: 168

        maxUses:

          type: integer

          minimum: 1

          nullable: true

      x-gmrlog-status: future

    Channel:

      type: object

      required: [id, groupId, kind, name, conversationId, createdAt]

      properties:

        id:

          type: string

          format: uuid

        groupId:

          type: string

          format: uuid

        kind:

          $ref: '#/components/schemas/ChannelKind'

        name:

          type: string

          maxLength: 80

        description:

          type: string

          maxLength: 500

          nullable: true

        conversationId:

          type: string

          format: uuid

        createdAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    ChannelPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/Channel'

      x-gmrlog-status: future

    CreateChannelRequest:

      type: object

      required: [kind, name]

      properties:

        kind:

          $ref: '#/components/schemas/ChannelKind'

        name:

          type: string

          minLength: 1

          maxLength: 80

        description:

          type: string

          maxLength: 500

      x-gmrlog-status: future

    UpdateChannelRequest:

      type: object

      properties:

        name:

          type: string

          maxLength: 80

        description:

          type: string

          maxLength: 500

          nullable: true

      x-gmrlog-status: future

    MessageAttachment:

      type: object

      required: [id, messageId, url, mediaType, createdAt]

      properties:

        id:

          type: string

          format: uuid

        messageId:

          type: string

          format: uuid

        url:

          type: string

          format: uri

        mediaType:

          type: string

        createdAt:

          type: string

          format: date-time

      x-gmrlog-status: future

    MessageAttachmentPage:

      allOf:

        - $ref: './common/schemas/cursor-page.yaml#/components/schemas/CursorPage'

        - type: object

          properties:

            items:

              type: array

              items:

                $ref: '#/components/schemas/MessageAttachment'

      x-gmrlog-status: future

    CreateMessageAttachmentRequest:

      type: object

      required: [url, mediaType]

      properties:

        url:

          type: string

          format: uri

        mediaType:

          type: string

      x-gmrlog-status: future

    VoiceRoom:

      type: object

      required: [id, channelId, status, createdAt]

      properties:

        id:

          type: string

          format: uuid

        channelId:

          type: string

          format: uuid

        status:

          type: string

          enum: [OPEN, CLOSED]

        participantCount:

          type: integer

          minimum: 0

        createdAt:

          type: string

          format: date-time

      x-gmrlog-status: future

'''

    text = header + "".join(paths) + components
    OUT.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT} ({len(text.splitlines())} lines)")


if __name__ == "__main__":
    main()
