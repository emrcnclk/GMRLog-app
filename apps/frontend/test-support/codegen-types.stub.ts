/**
 * Stand-in for `react-native/Libraries/Types/CodegenTypes`.
 *
 * Types only, and Flow-typed at the source, so it is erased at runtime
 * everywhere except a bundler that insists on parsing it. `react-native-svg`
 * imports it alongside `codegenNativeComponent`.
 */
export type DirectEventHandler<T> = (event: { nativeEvent: T }) => void;
export type BubblingEventHandler<T> = (event: { nativeEvent: T }) => void;
export type Int32 = number;
export type Float = number;
export type Double = number;
export type WithDefault<T> = T;
