import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropdownMenu from '../components/ui/DropdownMenu';

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

  it('closes when clicking outside and when another menu is opened', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <p>Fuera</p>
        <DropdownMenu label="Uno"><button type="button">Item uno</button></DropdownMenu>
        <DropdownMenu label="Dos"><button type="button">Item dos</button></DropdownMenu>
      </div>
    );

    await user.click(screen.getByRole('button', { name: /uno/i }));
    expect(screen.getByText('Item uno')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dos/i }));
    expect(screen.queryByText('Item uno')).not.toBeInTheDocument();
    expect(screen.getByText('Item dos')).toBeInTheDocument();

    await user.click(screen.getByText('Fuera'));
    expect(screen.queryByText('Item dos')).not.toBeInTheDocument();
  });
});
