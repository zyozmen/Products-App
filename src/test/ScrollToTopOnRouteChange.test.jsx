import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { act } from 'react';
import ScrollToTopOnRouteChange from '../components/navigation/ScrollToTopOnRouteChange.jsx';

let goTo;
function Navigator() {
  goTo = useNavigate();
  return null;
}

describe('ScrollToTopOnRouteChange', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it('scrolls to the top on mount and on every route change', () => {
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <ScrollToTopOnRouteChange />
        <Navigator />
      </MemoryRouter>
    );
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);

    act(() => goTo('/orders'));
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });
});
