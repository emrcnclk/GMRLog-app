/**
 * Metro resolves a font import to an opaque numeric asset id, which is one of
 * the `FontSource` shapes `expo-font` accepts. Expo's own types declare CSS
 * modules but no binary assets, and this is the first asset import in the repo,
 * so the declaration lives here rather than in a shared types package.
 *
 * Typing these as `number` rather than `any` is what keeps the imports clear of
 * `@typescript-eslint/no-unsafe-assignment`.
 */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
