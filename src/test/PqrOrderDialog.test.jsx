import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PqrOrderDialog from '../components/admin/orders/PqrOrderDialog.jsx';
import userService from '../services/UserService.js';
import { marketplaceService } from '../services/marketplaceService';

const productName = 'Producto · Unidad · 1 g · SKU';
const productSuggestion = `${productName} · Stock: 5`;
const productPage = {
    content: [{
        nombre: 'Producto',
        presentaciones: [{ presentacionId: 'p1', nombre: 'Unidad', contenidoUnidad: 1, unidadBase: 'g', sku: 'SKU', stockDisponible: 5 }],
    }],
    totalPages: 1,
};

const users = [
    { username: 'maria', nombre: 'María', apellido: 'Pérez', direccion: 'Calle 10', telefono: '3001234567' },
    { username: 'juan', nombre: 'Juan', apellido: 'Gómez', direccion: 'Carrera 5', telefono: '3101234567' },
    { username: 'sin-datos', nombre: 'Ana' },
];

function renderDialog(onCreate = vi.fn().mockResolvedValue(undefined)) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <PqrOrderDialog onCancel={vi.fn()} onCreate={onCreate} t={(key) => key} />
        </QueryClientProvider>,
    );
    return onCreate;
}

function fillOrder(username, product = productSuggestion) {
    fireEvent.change(screen.getByLabelText('pqr_customer_username *'), { target: { value: username } });
    fireEvent.change(screen.getByLabelText('other_recipient_name *'), { target: { value: 'María Pérez' } });
    fireEvent.change(screen.getByLabelText('address *'), { target: { value: 'Calle 1' } });
    fireEvent.change(screen.getByLabelText('contact_phone *'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/product \*/), { target: { value: product } });
    fireEvent.change(screen.getByLabelText('pqr_notes *'), { target: { value: 'Reemplazo' } });
    fireEvent.click(screen.getByRole('button', { name: 'create_pqr_order' }));
}

beforeEach(() => vi.spyOn(marketplaceService, 'list').mockResolvedValue(productPage));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('PQR customer autocomplete', () => {
    it('offers loaded users and sends the selected username in the PQR', async () => {
        const getUsers = vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
        const create = renderDialog();
        const input = screen.getByLabelText('pqr_customer_username *');
        expect(input).toHaveAttribute('list', 'pqr-user-suggestions');
        await waitFor(() => expect(document.querySelectorAll('#pqr-user-suggestions option')).toHaveLength(3));
        expect(document.querySelector('#pqr-user-suggestions option[value="maria"]')).toHaveAttribute('label', 'María Pérez');
        fillOrder('maria');
        await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ username: 'maria' })));
        expect(getUsers).toHaveBeenCalledTimes(1);
    });

    it('allows manual input and retries after a user loading error', async () => {
        const getUsers = vi.spyOn(userService, 'getUsers')
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce(users);
        const create = renderDialog();
        expect(await screen.findByText('pqr_users_error')).toBeInTheDocument();
        await waitFor(() => expect(document.querySelectorAll('#pqr-product-suggestions option')).toHaveLength(1));
        fillOrder('usuario-manual');
        await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ username: 'usuario-manual' })));
        fireEvent.click(screen.getByRole('button', { name: 'pqr_users_retry' }));
        await waitFor(() => expect(document.querySelectorAll('#pqr-user-suggestions option')).toHaveLength(3));
        expect(screen.queryByText('pqr_users_error')).not.toBeInTheDocument();
        expect(getUsers).toHaveBeenCalledTimes(2);
    });

    it('fills delivery fields for the selected user and submits editable values', async () => {
        vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
        const create = renderDialog();
        await waitFor(() => expect(document.querySelectorAll('#pqr-user-suggestions option')).toHaveLength(3));
        fireEvent.change(screen.getByLabelText('pqr_customer_username *'), { target: { value: 'maria' } });
        expect(screen.getByLabelText('other_recipient_name *')).toHaveValue('María Pérez');
        expect(screen.getByLabelText('address *')).toHaveValue('Calle 10');
        expect(screen.getByLabelText('contact_phone *')).toHaveValue('3001234567');

        fireEvent.change(screen.getByLabelText('other_recipient_name *'), { target: { value: 'Otra persona' } });
        fireEvent.change(screen.getByLabelText('address *'), { target: { value: 'Otra dirección' } });
        fireEvent.change(screen.getByLabelText('contact_phone *'), { target: { value: '3201234567' } });
        await waitFor(() => expect(document.querySelectorAll('#pqr-product-suggestions option')).toHaveLength(1));
        fireEvent.change(screen.getByLabelText(/product \*/), { target: { value: productSuggestion } });
        fireEvent.change(screen.getByLabelText('pqr_notes *'), { target: { value: 'Reemplazo' } });
        fireEvent.click(screen.getByRole('button', { name: 'create_pqr_order' }));
        await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
            username: 'maria',
            delivery: { recipientName: 'Otra persona', address: 'Otra dirección', addressComplement: '', contactPhone: '3201234567' },
        })));
    });

    describe('PQR product autocomplete', () => {
        it('searches on the server and submits the selected presentation ID and name', async () => {
            vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
            const create = renderDialog();
            const input = screen.getByLabelText(/product \*/);
            expect(input).toHaveAttribute('list', 'pqr-product-suggestions');
            fireEvent.change(input, { target: { value: 'Producto' } });
            await waitFor(() => expect(marketplaceService.list).toHaveBeenCalledWith('Producto', 0, 20, {}));
            await waitFor(() => expect(document.querySelector('#pqr-product-suggestions option')).toHaveValue(productSuggestion));
            fillOrder('maria');
            await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
                items: [{ productId: 'p1', name: productName, quantity: 1 }],
            })));
        });

        it('requires a new selection after editing the product and checks available stock', async () => {
            vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
            const create = renderDialog();
            await waitFor(() => expect(document.querySelector('#pqr-product-suggestions option')).toBeTruthy());
            fillOrder('maria');
            await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
            create.mockClear();
            fireEvent.change(screen.getByLabelText(/product \*/), { target: { value: 'Producto distinto' } });
            fireEvent.click(screen.getByRole('button', { name: 'create_pqr_order' }));
            expect(await screen.findByText('Selecciona una presentación disponible.')).toBeInTheDocument();
            expect(create).not.toHaveBeenCalled();
            await waitFor(() => expect(document.querySelector('#pqr-product-suggestions option')).toBeTruthy());
            fireEvent.change(screen.getByLabelText(/product \*/), { target: { value: productSuggestion } });
            fireEvent.change(screen.getByLabelText('quantity *'), { target: { value: '6' } });
            fireEvent.click(screen.getByRole('button', { name: 'create_pqr_order' }));
            expect(await screen.findByText('La cantidad supera la disponibilidad actual de la presentación.')).toBeInTheDocument();
            expect(create).not.toHaveBeenCalled();
        });

        it('keeps the selected presentation when moving between server pages', async () => {
            vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
            marketplaceService.list.mockImplementation(async (_search, page) => page === 0
                ? { ...productPage, totalPages: 2 }
                : { content: [], totalPages: 2 });
            const create = renderDialog();
            await waitFor(() => expect(document.querySelector('#pqr-product-suggestions option')).toBeTruthy());
            fillOrder('maria');
            await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
            create.mockClear();
            fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
            await screen.findByText('Página 2 de 2');
            fireEvent.click(screen.getByRole('button', { name: 'create_pqr_order' }));
            await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
                items: [{ productId: 'p1', name: productName, quantity: 1 }],
            })));
        });

        it('shows marketplace errors and allows retrying', async () => {
            vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
            marketplaceService.list.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(productPage);
            renderDialog();
            expect(await screen.findByText(/No se pudieron cargar presentaciones: Sin conexión/)).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de presentaciones' }));
            await waitFor(() => expect(document.querySelector('#pqr-product-suggestions option')).toHaveValue(productSuggestion));
        });

        it('distinguishes identical presentation labels and submits the selected ID', async () => {
            vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
            marketplaceService.list.mockResolvedValue({
                ...productPage,
                content: [{
                    ...productPage.content[0],
                    presentaciones: [
                        productPage.content[0].presentaciones[0],
                        { ...productPage.content[0].presentaciones[0], presentacionId: 'p2' },
                    ],
                }],
            });
            const create = renderDialog();
            await waitFor(() => expect(document.querySelectorAll('#pqr-product-suggestions option')).toHaveLength(2));
            fillOrder('maria', `${productSuggestion} · ID: p2`);
            await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
                items: [{ productId: 'p2', name: productName, quantity: 1 }],
            })));
        });
    });

    it('replaces delivery data when changing users and clears missing data', async () => {
        vi.spyOn(userService, 'getUsers').mockResolvedValue(users);
        renderDialog();
        await waitFor(() => expect(document.querySelectorAll('#pqr-user-suggestions option')).toHaveLength(3));
        const input = screen.getByLabelText('pqr_customer_username *');
        fireEvent.change(input, { target: { value: 'maria' } });
        fireEvent.change(input, { target: { value: 'juan' } });
        expect(screen.getByLabelText('other_recipient_name *')).toHaveValue('Juan Gómez');
        expect(screen.getByLabelText('address *')).toHaveValue('Carrera 5');
        expect(screen.getByLabelText('contact_phone *')).toHaveValue('3101234567');
        fireEvent.change(input, { target: { value: 'sin-datos' } });
        expect(screen.getByLabelText('other_recipient_name *')).toHaveValue('Ana');
        expect(screen.getByLabelText('address *')).toHaveValue('');
        expect(screen.getByLabelText('contact_phone *')).toHaveValue('');
    });
});
