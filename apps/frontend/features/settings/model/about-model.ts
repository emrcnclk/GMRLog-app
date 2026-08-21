import { LEGAL_ROUTES } from '../../legal/model/legal-model';

/**
 * 12.3 — where an About row goes.
 *
 * The discriminator is the point. The previous shape carried one nullable
 * `href` string, which made "open a browser at this URL" and "navigate inside
 * the app" indistinguishable at the type level — and that ambiguity is exactly
 * what shipped: two rows marked `placeholder: false` pointed at
 * `https://gmrlog.com/privacy` and `/terms`, which nothing in this repo serves,
 * so Settings › About opened a browser at a 404. A row cannot be wrong that way
 * now without failing to typecheck.
 */
export type AboutLinkTarget =
  { kind: 'route'; path: string } | { kind: 'external'; url: string } | { kind: 'none' };

export interface AboutLink {
  id: string;
  title: string;
  subtitle: string;
  target: AboutLinkTarget;
  placeholder: boolean;
}

export const ABOUT_LINKS: readonly AboutLink[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'How we handle your data',
    target: { kind: 'route', path: LEGAL_ROUTES.privacy },
    placeholder: false,
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    subtitle: 'Rules of the Digital Home',
    target: { kind: 'route', path: LEGAL_ROUTES.terms },
    placeholder: false,
  },
  {
    // KVKK Art. 10 requires this as a document distinct from the privacy
    // policy (12.1), so it gets its own row rather than being folded into one.
    id: 'disclosure',
    title: 'KVKK Disclosure Notice',
    subtitle: 'Aydınlatma Metni',
    target: { kind: 'route', path: LEGAL_ROUTES.disclosure },
    placeholder: false,
  },
  {
    id: 'oss',
    title: 'Open Source Licenses',
    subtitle: 'Third-party notices',
    target: { kind: 'none' },
    placeholder: true,
  },
  {
    id: 'contact',
    title: 'Contact',
    subtitle: 'hello@gmrlog.com',
    target: { kind: 'external', url: 'mailto:hello@gmrlog.com' },
    placeholder: false,
  },
] as const;

export function aboutVersionLine(version: string, build: string): string {
  return `GMRLOG ${version} (${build})`;
}

export function aboutCopyright(year = new Date().getFullYear()): string {
  return `© ${String(year)} GMRLOG. All rights reserved.`;
}

export function aboutSignedInLine(handle: string): string {
  return `Signed in as @${handle}`;
}
