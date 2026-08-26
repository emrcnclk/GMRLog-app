// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderWithTheme, screen } from '../../../../test-support/render';

import { CompletionDialog } from './completion-dialog';

/**
 * 13.1's editor. Three things here are decisions rather than styling, and each
 * one is invisible to a pure-logic test because it lives in what the dialog
 * offers and what it announces.
 *
 * Clear is only offered when there is something to clear — null is "not said"
 * and a Clear button on an empty field would suggest otherwise. Save is
 * refused on an empty field for the same reason: clearing is the explicit
 * gesture, not a side effect of deleting the text. And the dialog announces
 * itself as a dialog, which the account-deletion confirm did not until a live
 * render pass caught it announcing as a landmark region.
 */
describe('CompletionDialog', () => {
  const props = {
    visible: true,
    status: 'playing' as const,
    saving: false,
    error: null,
    onClose: () => undefined,
  };

  it('announces itself as a dialog, not as a region', () => {
    renderWithTheme(<CompletionDialog {...props} current={null} onSave={() => undefined} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('offers Clear only when there is a figure to clear', () => {
    const { unmount } = renderWithTheme(
      <CompletionDialog {...props} current={null} onSave={() => undefined} />,
    );
    expect(screen.queryByText('Clear')).toBeNull();
    unmount();

    renderWithTheme(<CompletionDialog {...props} current={40} onSave={() => undefined} />);
    expect(screen.getByText('Clear')).toBeTruthy();
  });

  it('clears with an explicit null rather than an empty string', () => {
    const onSave = vi.fn();
    renderWithTheme(<CompletionDialog {...props} current={40} onSave={onSave} />);

    fireEvent.click(screen.getByText('Clear'));

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('seeds the field with what the player last claimed', () => {
    renderWithTheme(<CompletionDialog {...props} current={62} onSave={() => undefined} />);

    expect(screen.getByDisplayValue('62')).toBeTruthy();
  });

  it('says why it will not take a number past a hundred', () => {
    renderWithTheme(<CompletionDialog {...props} current={null} onSave={() => undefined} />);

    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '120' } });

    expect(screen.getByText('A percentage cannot go past 100.')).toBeTruthy();
  });

  it('keeps digits only, so a numeric keypad is enough to complete it', () => {
    renderWithTheme(<CompletionDialog {...props} current={null} onSave={() => undefined} />);

    const field = screen.getByDisplayValue('');
    fireEvent.change(field, { target: { value: '4a2%' } });

    expect(screen.getByDisplayValue('42')).toBeTruthy();
  });

  it('names the shelf it is leaving the game on', () => {
    renderWithTheme(<CompletionDialog {...props} current={null} onSave={() => undefined} />);

    expect(screen.getByText(/playing shelf/)).toBeTruthy();
  });
});
