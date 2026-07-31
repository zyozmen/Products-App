import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropdownMenu from './DropdownMenu';

describe('DropdownMenu', () => {
  it('shows and hides the menu content when the trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu label="Opciones">
        <button type="button">Acción</button>
      </DropdownMenu>
    );

    expect(screen.queryByText('Acción')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /opciones/i }));

    expect(screen.getByText('Acción')).toBeInTheDocument();
  });
});
