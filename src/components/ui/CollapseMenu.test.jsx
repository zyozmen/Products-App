import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollapseMenu from './CollapseMenu';

describe('CollapseMenu', () => {
  it('renders the content container and shows it when opened', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <CollapseMenu title="Menú" contentClassName="navbar-collapse">
        <button type="button">Esquejes</button>
      </CollapseMenu>
    );

    const contentContainer = container.querySelector('.navbar-collapse');

    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).not.toHaveClass('show');

    await user.click(screen.getByRole('button', { name: /menú/i }));

    expect(contentContainer).toHaveClass('show');
    expect(screen.getByRole('button', { name: /esquejes/i })).toBeInTheDocument();
  });
});
