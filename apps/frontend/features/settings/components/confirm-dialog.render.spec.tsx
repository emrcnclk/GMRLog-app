// @vitest-environment happy-dom
import { Dialog, Text } from '@gmrlog/ui';
import { describe, expect, it } from 'vitest';

import { renderWithTheme, screen } from '../../../test-support/render';

/**
 * The delete-account confirmation announced itself as a landmark region, not
 * a dialog: the content view carried `accessibilityRole="summary"` (which RNW
 * renders as `<section role="region">`) while RNW's own `Modal` put
 * `aria-modal="true"` on a container with no role, where it announces
 * nothing. Both halves looked like they were doing something.
 *
 * Measured on the running app before the fix; pinned here so it cannot come
 * back silently. Four dialogs in the app share this primitive.
 */
describe('Dialog accessibility', () => {
  it('exposes one element that is a dialog, is modal, and is named', () => {
    renderWithTheme(
      <Dialog visible title="Delete your account?" onClose={() => undefined}>
        <Text role="body">This starts a 30-day grace period.</Text>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Delete your account?');
  });

  it('does not announce itself as a landmark region', () => {
    renderWithTheme(
      <Dialog visible title="Delete your account?" onClose={() => undefined}>
        <Text role="body">body</Text>
      </Dialog>,
    );

    // `queryByRole`, not a `[role="region"]` selector: `accessibilityRole=
    // "summary"` rendered a `<section>`, whose landmark role is implicit and
    // which an attribute selector walks straight past.
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renders nothing when not visible', () => {
    renderWithTheme(
      <Dialog visible={false} title="Delete your account?" onClose={() => undefined}>
        <Text role="body">hidden</Text>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
