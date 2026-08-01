# D3.21 — Friend System

**Status:** LOCKED for D3.21 implementation  
**Authority:** `docs/08_API/SOCIAL_API.yaml` (friends · presence) + this document  
**S1 note:** S1 table lists Follow, not Friends. Friends are an additive SOCIAL_API surface; Follow remains unchanged.

## Model

| Entity | Purpose |
|--------|---------|
| `FriendRequest` | pending · accepted · rejected · cancelled |
| `Friendship` | Accepted undirected edge (`userLowId` < `userHighId`) |
| `UserPresence` | Last-known presence stub (online · away · offline · invisible) |

## Operations

| Action | Route | Notes |
|--------|-------|-------|
| Send request | `POST /users/{userId}/friend-request` | Block/self rejected |
| Incoming | `GET /users/friend-requests` | Cursor pagination |
| Accept | `POST /users/friend-requests/{requestId}/accept` | Creates Friendship |
| Reject | `POST /users/friend-requests/{requestId}/reject` | |
| Cancel | `DELETE /users/friend-requests/{requestId}` | Sender only |
| List | `GET /friends` | Optional `q` search |
| Remove | `DELETE /users/{userId}/friend` | Hard-delete edge |
| Relationship | `GET /users/{userId}/relationship` | Follow + friend + block + mutual |
| Mutual | via relationship `mutualFriends` | |
| Online | `GET /friends/online` | Presence stub |
| Activity | `GET /friends/activity` | Friend actors only |
| Presence | `GET\|PATCH /presence`, `GET /users/{id}/presence` | Stub only — no realtime SLA |

## Privacy

- Blocked pairs cannot request or accept friendship.
- Friend profile visibility follows existing ContentVisibility / follow rules for nested content.
- Presence `invisible` projects as offline to non-self viewers.

## Notifications

- `friend_request` → receiver
- `friend_accepted` → original sender

## Activity

- `ActivityKind.friend` on accept
