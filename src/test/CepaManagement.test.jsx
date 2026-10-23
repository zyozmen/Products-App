import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CepaManagementPage from '../components/admin/cepas/CepaManagementPage.tsx';
import { marketplaceService } from '../services/marketplaceService.ts';
import categoryService from '../services/categoryService.js';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/admin/AdminNav.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({ default: (Component) => Component }));

const cepa = { id: 'strain', nombre: 'Tangerine', version: 3, categoryIds: [7], fotografia: null };

function renderAdmin() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    render(<QueryClientProvider client={client}><MemoryRouter><CepaManagementPage /></MemoryRouter></QueryClientProvider>);
    return invalidate;
}

beforeEach(() => {
    vi.spyOn(categoryService, 'getCategories').mockResolvedValue([
        { category_id: '7', name: 'Categoria A' }, { category_id: '8', name: 'Categoria B' },
    ]);
    vi.spyOn(marketplaceService, 'listCepas').mockResolvedValue({ cepas: [cepa], total: 1 });
    vi.spyOn(marketplaceService, 'createCepa').mockResolvedValue(cepa);
    vi.spyOn(marketplaceService, 'renameCepa').mockResolvedValue(cepa);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('strain category administration', () => {
    it('creates a strain with numeric shared category IDs', async () => {
        renderAdmin();
        await screen.findByLabelText('Nombre de la cepa');
        fireEvent.change(screen.getByLabelText(/Nueva cepa/), { target: { value: 'Nueva' } });
        const createCategories = screen.getAllByRole('group', { name: 'Categorías de la cepa' })[0];
        fireEvent.click(within(createCategories).getByLabelText('Categoria B'));
        fireEvent.click(screen.getByRole('button', { name: 'Crear cepa' }));
        await waitFor(() => expect(marketplaceService.createCepa).toHaveBeenCalledWith('Nueva', [8]));
    });

    it('saves category changes with the existing ID/version and invalidates the catalog', async () => {
        const invalidate = renderAdmin();
        await screen.findByLabelText('Nombre de la cepa');
        const editCategories = screen.getAllByRole('group', { name: 'Categorías de la cepa' })[1];
        expect(within(editCategories).getByLabelText('Categoria A')).toBeChecked();
        fireEvent.click(within(editCategories).getByLabelText('Categoria A'));
        fireEvent.click(within(editCategories).getByLabelText('Categoria B'));
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await waitFor(() => expect(marketplaceService.renameCepa).toHaveBeenCalledWith(cepa, 'Tangerine', [8]));
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cepas'] });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['marketplace'] });
        expect(await screen.findByText('Cepa actualizada.')).toBeInTheDocument();
    });

    it('sends an explicit empty list when removing all assignments', async () => {
        renderAdmin();
        await screen.findByLabelText('Nombre de la cepa');
        const editCategories = screen.getAllByRole('group', { name: 'Categorías de la cepa' })[1];
        fireEvent.click(within(editCategories).getByLabelText('Categoria A'));
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await waitFor(() => expect(marketplaceService.renameCepa).toHaveBeenCalledWith(cepa, 'Tangerine', []));
    });

    it('reports category loading failure and prevents accidental assignment changes', async () => {
        categoryService.getCategories.mockRejectedValue(new Error('No se cargaron las categorias'));
        renderAdmin();
        expect(await screen.findByText('No se cargaron las categorias')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reintentar categorías' })).toBeEnabled();
    });

    it('rejects IDs that would lose precision instead of submitting the wrong category', async () => {
        categoryService.getCategories.mockResolvedValue([{ category_id: '9007199254740993', name: 'ID fuera de rango' }]);
        renderAdmin();
        await screen.findByLabelText('Nombre de la cepa');
        fireEvent.change(screen.getByLabelText(/Nueva cepa/), { target: { value: 'Nueva' } });
        fireEvent.click(screen.getAllByLabelText('ID fuera de rango')[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Crear cepa' }));
        expect(await screen.findByText(/IDs numéricos válidos/)).toBeInTheDocument();
        expect(marketplaceService.createCepa).not.toHaveBeenCalled();
    });
});
