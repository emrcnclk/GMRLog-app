import { createElement, forwardRef, type ReactNode } from 'react';

/**
 * Stand-in for `react-native-svg` under the render harness.
 *
 * Any spec whose tree contained an SVG died with
 * `TypeError: Cannot set property 0 of #<CSSStyleDeclaration> which has only a
 * getter`, which reads like a react-native-svg bug and is not one. The chain is
 * this repo's own: `codegen-native-component.stub.ts` returns the *name* of the
 * native view, so React renders a host element called `RNSVGSvgView`,
 * react-dom treats it as a DOM tag, and the React Native style **array** that
 * comes with it is handed to `setValueForStyles`, which assigns `style[0]`.
 * A browser tolerates that assignment; happy-dom throws, because the module
 * code runs in strict mode.
 *
 * It matters far more than the four existing render specs suggested. Every
 * `Icon` in `@gmrlog/ui` is a lucide glyph and lucide renders through
 * `react-native-svg`, so *any* component with an icon in it — most of the app —
 * could not be mounted in a test at all. That is why the pass that built this
 * harness only covered icon-free surfaces, and it was never recorded as a
 * limit because nothing had tried.
 *
 * The stub renders the real DOM SVG tag with the string/number props intact and
 * drops `style`. Icons stay in the tree, `aria-hidden` and labels stay
 * assertable, and nothing here can be mistaken for a rendering test of the
 * artwork itself — assert on the element and its accessible name, never on the
 * path data.
 */
const DOM_TAG: Record<string, string> = {
  Svg: 'svg',
  Circle: 'circle',
  Ellipse: 'ellipse',
  G: 'g',
  Line: 'line',
  Path: 'path',
  Polygon: 'polygon',
  Polyline: 'polyline',
  Rect: 'rect',
  Defs: 'defs',
  LinearGradient: 'linearGradient',
  RadialGradient: 'radialGradient',
  Stop: 'stop',
  ClipPath: 'clipPath',
  Mask: 'mask',
  Use: 'use',
  Text: 'text',
  TSpan: 'tspan',
};

function stub(name: keyof typeof DOM_TAG) {
  const Component = forwardRef<unknown, Record<string, unknown>>(function SvgStub(props, ref) {
    const { children, ...rest } = props;
    const safe: Record<string, unknown> = { ref };

    // Only scalars survive, which is what drops `style`: a React Native style
    // is an object or an array, and it is exactly what react-dom cannot take
    // on a DOM element here.
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        safe[key] = value;
      }
    }

    return createElement(DOM_TAG[name] ?? 'svg', safe, children as ReactNode);
  });

  Component.displayName = `Svg.${name}`;
  return Component;
}

export const Svg = stub('Svg');
export const Circle = stub('Circle');
export const Ellipse = stub('Ellipse');
export const G = stub('G');
export const Line = stub('Line');
export const Path = stub('Path');
export const Polygon = stub('Polygon');
export const Polyline = stub('Polyline');
export const Rect = stub('Rect');
export const Defs = stub('Defs');
export const LinearGradient = stub('LinearGradient');
export const RadialGradient = stub('RadialGradient');
export const Stop = stub('Stop');
export const ClipPath = stub('ClipPath');
export const Mask = stub('Mask');
export const Use = stub('Use');
export const Text = stub('Text');
export const TSpan = stub('TSpan');

export default Svg;
