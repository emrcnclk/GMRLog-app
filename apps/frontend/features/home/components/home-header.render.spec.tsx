// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderWithTheme, screen } from '../../../test-support/render';

import { HomeHeader } from './home-header';

/**
 * §4's tab row — "Following / For you / Friends" — which shipped with two of
 * the three on the stated grounds that the app had no separate friends
 * audience. It did: `Friendship` is its own mutual table, and the feed's
 * `following` case was already unioning it with `Follow`. 13.2 gives the third
 * tab the narrower audience, and this pins that the tab exists, is reachable,
 * and reports itself as selected.
 *
 * `aria-selected` is the half worth mounting for: CLAUDE.md records that
 * `accessibilityState` never reaches the DOM on web, so a tab row can look
 * correct and tell a screen reader nothing about which tab is active.
 */
const noop = () => undefined;

describe('HomeHeader', () => {
  it('offers all three of §4 audiences', () => {
    renderWithTheme(
      <HomeHeader
        filter="for_you"
        onChangeFilter={noop}
        onPressSearch={noop}
        onPressNotifications={noop}
      />,
    );

    expect(screen.getByText('Following')).toBeTruthy();
    expect(screen.getByText('For you')).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();
  });

  it('asks for the friends feed when the tab is pressed', () => {
    const onChangeFilter = vi.fn();
    renderWithTheme(
      <HomeHeader
        filter="for_you"
        onChangeFilter={onChangeFilter}
        onPressSearch={noop}
        onPressNotifications={noop}
      />,
    );

    fireEvent.click(screen.getByText('Friends'));

    expect(onChangeFilter).toHaveBeenCalledWith('friends');
  });

  it('tells a screen reader which audience is showing', () => {
    renderWithTheme(
      <HomeHeader
        filter="friends"
        onChangeFilter={noop}
        onPressSearch={noop}
        onPressNotifications={noop}
      />,
    );

    const selected = screen
      .getAllByRole('tab')
      .filter((tab) => tab.getAttribute('aria-selected') === 'true');

    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toContain('Friends');
  });
});
