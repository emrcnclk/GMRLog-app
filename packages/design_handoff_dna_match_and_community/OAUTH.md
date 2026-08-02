# OAUTH.md — Sign in and sign up with Google, Steam, Discord

The prototype's first screen offers four ways in: Google, Steam, Discord, and email. Today `oauth-provider-buttons.tsx` renders all three and then shows "Provider sign-in is not available yet."

Good news: **the data model already anticipates this.** The `0_init` migration ships `auth_credential_type` as `('password', 'oauth')`, an `account_links` table with `purpose` including `'login'` and a status machine (`pending → awaiting_provider → completed | cancelled | failed`), and `connected_accounts` with a unique constraint per `(user_id, provider)`. The schema was designed for this and then not wired up.

> **0.1 — every claim in this document was checked against the schema and verified exact.** `auth_credential_type (password, oauth)`, `account_link_purpose (login, connect, import)`, `account_link_status (pending, awaiting_provider, completed, cancelled, failed)`, `connected_provider (steam, discord)`, and the `auth_credentials` / `connected_accounts` / `user_integrations` / `import_jobs` tables all exist as described. `SessionsService`, `oauth-provider-buttons.tsx`, `(settings)/integrations.tsx` and `lib/env.ts` are all present. The "Provider sign-in is not available yet." string lives in `login-screen.tsx:59` rather than in the buttons component. **This doc needs no correction beyond the missing dependency noted in §2.**

---

## 1. The three providers are not the same thing

This is the decision that shapes everything else, so make it deliberately:

| Provider    | Protocol            | Gives an email?                | Good as identity?                           |
| ----------- | ------------------- | ------------------------------ | ------------------------------------------- |
| **Google**  | OpenID Connect      | Yes, verified                  | **Yes** — a real identity provider          |
| **Discord** | OAuth 2.0           | Yes, verification flag exposed | **Yes**, with the verified flag checked     |
| **Steam**   | OpenID 2.0 (legacy) | **No**                         | **No** — an account handle, not an identity |

Steam returns a 64-bit SteamID and nothing else. No email, no name you can contact, no way to recover an account. Treating it as a primary identity means a player who loses their Steam access loses their GMRLOG account with no recovery path.

**So:**

- **Google and Discord are login providers.** They create `auth_credentials` rows with `type = 'oauth'` and `providerRef = '<provider>:<subject>'`.
- **Steam is a connection, not a login** — a `connected_accounts` row, which is exactly what that table is for ("Guest link state — never identity authority", per its own comment).

On the sign-up screen Steam still appears as a button, because that is what players expect and Steam is the reason most of them are here. Tapping it runs the Steam OpenID flow, then asks for a way to reach them:

> **Almost there.** Steam does not share an email address, so add one you can sign in with.
> [ email field ] [ Continue ]

One extra step, once, and the account is recoverable. Their Steam library import — which `user_integrations` and `import_jobs` already support — starts in the background while they finish onboarding. That turns the friction into the best moment in the product: their shelf is already populating when they land on the profile.

`connected_provider` is currently `('steam', 'discord')`. Add `google`, or add a separate `oauth_provider` enum for login providers and leave `connected_provider` to mean connections. The second is cleaner and matches the distinction above.

## 2. Flow

Use `expo-auth-session` with PKCE. It handles native and web from one call site, which matters here — this app ships both from one codebase.

> **0.1 correction — `expo-auth-session` is not installed.** It does not appear in `apps/frontend/package.json`. Task 4.3 assumes it is available; add the dependency (with `expo-crypto`, which PKCE needs) as the first step of 4.3, or as part of 4.1 alongside the migration.
>
> For contrast, the two other libraries the task list depends on **are** already present, so no action is needed there: `react-native-svg ^15.15.5` (task 6.3, the match ring) and `react-native-gesture-handler ~2.20.2` (task 3b.8, tier-list drag). `expo-font ~13.0.4` is present too — see the note in `THEME_MIGRATION.md` §4.

```
apps/frontend/features/auth/
  hooks/use-oauth-sign-in.ts        ← one hook, provider as an argument
  oauth-provider-buttons.tsx        ← already exists; wire it up
apps/backend/src/auth/
  oauth/oauth.controller.ts
  oauth/oauth.service.ts
  oauth/providers/google.provider.ts
  oauth/providers/discord.provider.ts
  oauth/providers/steam.provider.ts   ← OpenID 2.0, different shape from the other two
```

**Client-side, per attempt:**

1. `POST /auth/oauth/:provider/start` → the backend creates an `account_links` row (`purpose: 'login'`, `status: 'pending'`), returns an authorize URL and a state token.
2. `expo-auth-session` opens the provider. Redirect URI is a deep link on native, a route on web.
3. The provider returns a code to `/auth/oauth/:provider/callback`.
4. The backend exchanges the code **server-side** — the client never sees a client secret or a provider access token — verifies state, matches or creates the user, and issues your own session tokens through the existing `SessionsService`.
5. `status: 'completed'`; the client receives the same session shape it gets from password login and `useAuthStore.login` is unchanged.

**Never** let the client hold a provider token. Everything crosses the backend.

## 3. Account matching

The rule, in order:

1. An `auth_credentials` row exists for `(oauth, provider:subject)` → sign that user in. Done.
2. No such row, but a **verified** email from the provider matches an existing user → link: create the oauth credential against that user. This is the "I signed up with email, now I'm using Google" case, and it must work or you get duplicate accounts.
3. **Unverified** email that matches an existing user → do **not** link. Ask them to sign in with their password first, then connect from Settings. Auto-linking on an unverified email is an account-takeover path.
4. No match → new user. Provision a handle from the provider's display name, deduplicated (`kaan`, `kaan2`, …), and send them into onboarding to confirm it.

Wrap steps 2–4 in a transaction. Two devices tapping Google at the same moment must not create two users.

## 4. Errors

Every one of these needs a mapped message in `mapAuthError` and lands in the existing `ErrorBanner`. The screen already has the component — it just needs the cases:

- Player cancels in the provider sheet → **no error at all**, return silently to the screen. This is the most common outcome and it is not a failure.
- Provider unreachable or times out → "Google is not responding. Try again, or use email."
- Email already registered with a password, unverified provider email → "This email is already registered. Sign in with your password, then connect Google from Settings."
- Provider returns no email (Discord edge case) → the same email-capture step Steam uses.
- State mismatch or expired link → "That sign-in expired. Try again." Mark the `account_links` row `failed`.

## 5. Settings

`(settings)/integrations.tsx` and the `connected_accounts` table already exist. Once login works, Settings should show all three providers with their state — connected, disconnected, expired — and allow connect and disconnect.

One guard: **refuse to disconnect the last remaining sign-in method.** If a player signed up with Google and has no password, disconnecting Google locks them out. Prompt them to set a password first.

## 6. Configuration

Client IDs and secrets go through `packages/config` and `apps/frontend/lib/env.ts`, never inline. Redirect URIs must be registered per environment with each provider — this is the step that most often blocks a first attempt, so register dev, staging and production up front.

Steam has no client secret; it is an OpenID 2.0 return-URL verification. It will not fit the shape of the other two providers, and trying to force it into a shared interface produces worse code than letting `steam.provider.ts` be its own thing.

## 7. Order of work

1. Enum + migration (`google` as a login provider)
2. `oauth.service.ts` with the matching rules and a table-driven test — this is where the account-takeover risk lives, so test it before wiring any UI
3. Google end to end, native and web
4. Discord (nearly identical to Google)
5. Steam plus the email-capture step
6. Settings connect / disconnect, with the last-method guard

Google alone is worth shipping. Do not hold the release for Steam.
