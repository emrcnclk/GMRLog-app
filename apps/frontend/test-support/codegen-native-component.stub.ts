/**
 * Stand-in for `react-native/Libraries/Utilities/codegenNativeComponent`.
 *
 * `react-native-svg` imports it, and it is one of the Flow-typed files in
 * React Native's source tree, so it re-introduced
 * `SyntaxError: Unexpected token 'typeof'` even with `react-native` itself
 * aliased to `react-native-web`. On web the function has no meaning — it
 * exists to declare a native view for codegen — so returning the name is
 * enough for the module graph to load.
 */
export default function codegenNativeComponent(name: string): string {
  return name;
}
