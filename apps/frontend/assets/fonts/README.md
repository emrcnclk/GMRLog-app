# Fonts

Four static files, registered in [`lib/fonts/load-fonts.ts`](../../lib/fonts/load-fonts.ts)
under the names `FONT_FAMILY` declares in `packages/ui/src/theme/tokens.ts`. The
registration key, the token value and the filename must all agree.

| File                      | Family name           | Weight | Roles                         |
| ------------------------- | --------------------- | ------ | ----------------------------- |
| `Geist-Light.ttf`         | `Geist-Light`         | 300    | `display`, `title1`, `title2` |
| `Geist-Regular.ttf`       | `Geist-Regular`       | 400    | `title3`, `body`, `bodySm`    |
| `Geist-Medium.ttf`        | `Geist-Medium`        | 500    | `headline`, `label`           |
| `IBMPlexMono-Regular.ttf` | `IBMPlexMono-Regular` | 400    | `meta`, `metaSm`              |

Both families are SIL OFL 1.1. Geist ships from `vercel/geist-font`; IBM Plex
Mono from `IBM/plex`.

## Static files only

Do not substitute the variable builds (`Geist[wght].ttf`,
`IBMPlexMono[wght].ttf`). React Native's `fontWeight` does not drive a variable
axis on Android, so a variable file renders one weight everywhere and the
300/400/500 hierarchy silently collapses.

## Why these two

**Geist** replaces the platform default. Nothing was registered before, so the
app fell back to SF on iOS and Roboto on Android — and Roboto Light is markedly
lighter than SF Light, so a design whose hierarchy rests on large, light type
rendered differently per platform.

**IBM Plex Mono** carries full Latin Extended-A. GMRLog is a Turkish product, so
`ğ ı ş İ ç ö ü` — including the dotted/dotless capital-I pair — must be real
glyphs. A fallback substitution is conspicuous in a monospace face, where every
glyph sits on the same advance.
