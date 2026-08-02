# How to run this

You do **not** paste a long prompt for every step.

Two files do that job: `CLAUDE.md` carries the rules (Claude Code reads it automatically at the start of every session), and `TASKS.md` carries the ordered work. So each session is one short sentence from you.

---

## Setup, once

```bash
cd GMRLog
git checkout -b feat/gmrlog-redesign

# CLAUDE.md must sit at the REPO ROOT, not inside the handoff folder
cp packages/design_handoff_dna_match_and_community/CLAUDE.md ./CLAUDE.md

pnpm install
pnpm turbo run typecheck lint test    # baseline — know what was already failing
```

Open `packages/design_handoff_dna_match_and_community/GMRLOG.dc.html` in a browser and click through the screen chips. That is the target.

If a `CLAUDE.md` already exists at the root, merge rather than overwrite — keep whatever your team put there and append the design law section.

---

## Then, every session

```bash
claude
```

```
Read TASKS.md and do the next unchecked task.
```

That is the whole prompt. Every time.

The model reads `CLAUDE.md` (the rules), reads `TASKS.md` (where the work is), takes one task, does it, commits, ticks the box. Then:

```
/clear
```

…and the same sentence again for the next task.

`/clear` matters. Without it the model drags Phase 1's decisions into Phase 6 and starts working from memory instead of re-reading the docs.

---

## When to step in

**After 0.1** — it reports where the docs are wrong. Read that report properly; it is the only step whose output is words rather than code.

**After 1.5** — the palette now touches every screen. Look at the app yourself:

```bash
pnpm --filter frontend exec expo start --web
```

**After 3.1 (Achievements)** — the smallest screen, but it establishes the rarity geometry the whole app reuses. If it lands, the rest will.

**After 4.2** — the OAuth account-matching rules. Read the tests. This is the one place in the project where a mistake is a security bug, not a visual one.

**After 3.8 and 3.9** — Game hub and Profile are the two screens that carry the product's character.

Everywhere else, ticking along task by task is fine.

---

## Which model

Switch with `/model` inside Claude Code. Per task:

| Task                                     | Model                      | Why                                                                 |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| 0.1 Reality check                        | **Opus**                   | Reading a large repo critically and disagreeing with a doc          |
| 1.1–1.3 Palette, type, radius            | Sonnet                     | Values are written out; mechanical                                  |
| 1.4 Rarity geometry                      | **Opus**                   | A design rule, not a value swap — needs judgment about tiers        |
| 1.5 Sweep                                | Sonnet, then look yourself | The real check is your eyes                                         |
| 2.1 Shared patterns                      | **Opus**                   | Everything downstream inherits these APIs; worth getting right once |
| 3.1 Achievements                         | **Opus**                   | First screen — sets the pattern the other eleven copy               |
| 3.2–3.7 Settings → Discover              | Sonnet                     | Pattern already established                                         |
| 3.8 Game hub                             | **Opus**                   | The overlap hero; hardest layout in the app                         |
| 3.9 Profile                              | **Opus**                   | The player record card                                              |
| 3.10–3.12 Auth screens                   | Sonnet                     | One shell, three states                                             |
| 3b.1–3b.3 Communities, People            | Sonnet                     | Patterns established                                                |
| 3b.4 Review composer                     | **Opus**                   | The borderless writing surface needs restraint                      |
| 3b.5–3b.7 Subscription, Customize, Store | Sonnet                     |                                                                     |
| 3b.8 Tier lists                          | **Opus**                   | Cross-platform drag and drop                                        |
| 3b.9–3b.10 Events, Tournament            | Sonnet                     |                                                                     |
| 3b.11–3b.13 Studio, Publisher, Creator   | Sonnet                     | Dense but well specified                                            |
| 4.1 Enum + migration                     | Sonnet                     | Mechanical                                                          |
| 4.2 OAuth service                        | **Opus**                   | Account matching — a mistake here is a security bug                 |
| 4.3–4.5 Google, Discord, Steam           | Sonnet                     | Well-specified once 4.2 is right                                    |
| 4.6–4.7 Errors, Settings                 | Sonnet                     |                                                                     |
| 5.1–5.3 Engine, persist, DTO             | Sonnet                     | Tightly specified                                                   |
| 5.4 Match endpoint                       | **Opus**                   | Thresholds, thin-data policy, verdict templates — product judgment  |
| 5.5 Traits                               | Sonnet                     |                                                                     |
| 6.1–6.2 Token, rail                      | Sonnet                     |                                                                     |
| 6.3 Ring                                 | Sonnet                     | Standard SVG arc                                                    |
| 6.4 DNA panel                            | **Opus**                   | Composition plus four states                                        |
| 7.1–7.4 Community                        | Sonnet                     |                                                                     |
| 8.1–8.4 Passes                           | **Opus**                   | Judgment calls about what is wrong                                  |
| Any review pass                          | **Opus**                   | Reviewing is where it earns its cost                                |

Roughly: **Opus for the first of a kind, the security-shaped, and the judgment calls. Sonnet for everything that follows a pattern already set.** That is about nine Opus tasks out of forty.

Two habits worth more than the split itself: give Opus the task that _establishes_ a pattern and Sonnet the ones that _repeat_ it, and always review with Opus in a fresh session.

---

## Review pass

Every few tasks, in a fresh session:

```
Review the diff on this branch against CLAUDE.md and the docs in
packages/design_handoff_dna_match_and_community/.

Flag: raw hex, hand-rolled components that duplicate something in @gmrlog/ui,
accent used as a filled background, new screens where a doc said extend an
existing one, deleted loading/empty/error states, and anything that breaks on
the neutral accent.

Don't fix anything. Just the list.
```

Use Opus for this. Reviewing is where it earns its cost.

---

## If a task goes wrong

Do not argue with the model in the same session — the bad context stays. Instead:

```bash
git reset --hard HEAD    # or git checkout -- <files>
```

`/clear`, then re-run the same sentence with one line of correction appended:

```
Read TASKS.md and do the next unchecked task. Note: the previous attempt
rebuilt the bar chart by hand — use DistributionBars from @gmrlog/ui.
```

If the same correction is needed twice, it belongs in `CLAUDE.md`, not in the prompt. Add it there and it applies to every session afterwards.

---

## Finishing

```bash
pnpm turbo run typecheck lint test build
pnpm --filter frontend exec expo start        # i / a for native
pnpm --filter frontend exec expo start --web
```

Phases 8.1–8.3 are the cross-platform, accessibility and monochrome passes. Do not skip the neutral-accent pass — it is the cheapest way to catch a screen that is leaning on colour to do work that layout should be doing.

---

## Shortest useful path

If you want the product to look right before anything else ships: **Phase 1, then 3.1, 3.8 and 3.9.** Palette, then the three screens that carry the character. Everything else is additive.
