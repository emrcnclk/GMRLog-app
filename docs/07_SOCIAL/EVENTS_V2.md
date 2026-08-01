# Events v2 (D3.24)

**Document:** `docs/07_SOCIAL/EVENTS_V2.md`  
**Status:** **PLANNED** — D3.24 v1.3  
**Authority:** F2.11 · [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md)

---

## Mission

Social play moments — especially co-op — beyond simple RSVP.

---

## Kinds

Tournament · LAN Party · Watch Party · Co-op Session · Raid · Release Countdown  
(+ retained: release · community_night · speedrun · game · community · seasonal)

---

## Participation / social states (v1.3)

| State | Prisma / amendment |
|-------|-------------------|
| Going | `going` |
| Interested | `interested` |
| Declined | `not_going` |
| Looking for Team | add `looking_for_team` |
| Need Players | add `need_players` |
| Hosting | add `hosting` |

LFG states are especially valuable for Co-op Session · Raid · LAN.

Also: **Invite Friends** · **Reminder** · **Share** (client).

API: `POST /events/:id/rsvp` with expanded `state` · `POST /events/:id/invite`

---

## Test Gate

LFG state transitions · invite · reminder · kind AuthZ.
