# D3.21 — Social Graph

**Status:** LOCKED for D3.21 · **D3.24 v1.3 relationship weights PLANNED**

## Edges

| Edge | Direction | Storage | Mutability |
|------|-----------|---------|------------|
| Follow | directed | `Follow` | POST/DELETE `/follows` (S1) |
| Block | directed | `Block` | existing blocks module |
| Mute | directed | `Mute` (ensure physical if missing) | POST/DELETE mute surface — **D3.24 required** |
| Friendship | undirected | `Friendship` | Friend System (SOCIAL_API) |
| FriendRequest | directed pending | `FriendRequest` | Friend System |

## Semantics (D3.24)

| Edge | Meaning |
|------|---------|
| **Follow** | Unidirectional interest — timeline `followWeight` |
| **Friend** | Bidirectional trust — timeline `friendWeight` (**> followWeight**) |
| **Block** | Hard exclude — no feed, no notify, no graph mutations |
| **Mute** | Soft exclude — hide from viewer feed; target not notified |

## Counts

- `followerCount` / `followingCount` from Follow  
- `friendCount` from Friendship  
- `mutualFriends` computed pairwise  
- `communityCount` from CommunityMember  

## Visibility rules

- Follow does **not** imply Friendship.  
- Friendship does **not** auto-create Follow.  
- Block wins over Follow/Friend/Mute.  
- Mute does not create Block.

## Presence

Ephemeral stub (`UserPresence`). Not a graph edge.

## Search

- Friend search: handle/displayName over friend ids.  
- Global user search: Meilisearch `/search`.
