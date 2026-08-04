export interface AboutLink {
  id: string;
  title: string;
  subtitle: string;
  href: string | null;
  placeholder: boolean;
}

export const ABOUT_LINKS: readonly AboutLink[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'How we handle your data',
    href: 'https://gmrlog.com/privacy',
    placeholder: false,
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    subtitle: 'Rules of the Digital Home',
    href: 'https://gmrlog.com/terms',
    placeholder: false,
  },
  {
    id: 'oss',
    title: 'Open Source Licenses',
    subtitle: 'Third-party notices',
    href: null,
    placeholder: true,
  },
  {
    id: 'contact',
    title: 'Contact',
    subtitle: 'hello@gmrlog.com',
    href: 'mailto:hello@gmrlog.com',
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
