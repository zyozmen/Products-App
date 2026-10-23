import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import MarketplaceShopList from '../components/shop/MarketplaceShopList.jsx';
import { marketplaceService } from '../services/marketplaceService.ts';
import categoryService from '../services/categoryService.js';
import translationService from '../services/TranslationService.js';

function Shop() {
    const location = useLocation();
    const navigate = useNavigate();
    return <>
        <button onClick={() => navigate(-1)}>Volver</button>
        <output data-testid="query">{location.search}</output>
        <MarketplaceShopList location={location} navigate={navigate} />
    </>;
}

function renderShop(query = '') {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    return render(<QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/shop${query}`]}><Shop /></MemoryRouter>
    </QueryClientProvider>);
}

beforeEach(() => {
    translationService.setLanguage('ES');
    vi.spyOn(categoryService, 'getCategories').mockResolvedValue([
        { category_id: '7', name: 'Categoria A' }, { category_id: '8', name: 'Categoria B' },
    ]);
    vi.spyOn(marketplaceService, 'list').mockResolvedValue({
        content: [{
            cepaId: 'strain', nombre: 'Tangerine', precioDesde: 8000, fotografia: null,
            presentaciones: [{ presentacionId: 'p1', precioVenta: 8000 }],
        }],
        page: 0, size: 20, totalElements: 21, totalPages: 2,
    });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('marketplace original filters', () => {
    it('restores the responsive sidebar, price ranges and categories without fabricated counts', async () => {
        const { container } = renderShop();
        await screen.findByLabelText('Categoria A');
        expect(container.querySelector('#price-1')).toBeInTheDocument();
        expect(container.querySelector('#price-all')).toBeChecked();
        expect(container.querySelector('#category-all')).toBeChecked();
        expect(container.querySelector('#shop-filters-panel')).toHaveClass('hu-hidden');
        const toggle = screen.getByRole('button', { expanded: false });
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(container.querySelector('#shop-filters-panel')).toHaveClass('hu-grid');
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('combines search, multiple categories and price on the server and resets paging', async () => {
        const { container } = renderShop('?buscar=10gr');
        await screen.findByLabelText('Categoria A');
        fireEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('10gr', 1, 20, expect.anything()));
        fireEvent.click(screen.getByLabelText('Categoria A'));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('10gr', 0, 20,
            { categoryIds: ['7'], minPrice: null, maxPrice: null }));
        fireEvent.click(screen.getByLabelText('Categoria B'));
        fireEvent.click(container.querySelector('#price-2'));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('10gr', 0, 20,
            { categoryIds: ['7', '8'], minPrice: 50000, maxPrice: 100000 }));
        expect(await screen.findByRole('link', { name: /Tangerine/ })).toBeInTheDocument();
        expect(new URLSearchParams(screen.getByTestId('query').textContent).getAll('categoryIds')).toEqual(['7', '8']);
    });

    it('preserves category and price when searching and clearing the search', async () => {
        const { container } = renderShop('?categoryIds=7&minPrice=0&maxPrice=50000');
        await screen.findByLabelText('Categoria A');
        fireEvent.change(container.querySelector('#product-name-filter'), { target: { value: '  Tangerine  ' } });
        fireEvent.submit(container.querySelector('#product-name-filter').closest('form'));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('Tangerine', 0, 20,
            { categoryIds: ['7'], minPrice: 0, maxPrice: 50000 }));
        fireEvent.change(container.querySelector('#product-name-filter'), { target: { value: '' } });
        fireEvent.submit(container.querySelector('#product-name-filter').closest('form'));
        await waitFor(() => expect(new URLSearchParams(screen.getByTestId('query').textContent).has('buscar')).toBe(false));
        expect(marketplaceService.list).toHaveBeenCalledWith('', 0, 20,
            { categoryIds: ['7'], minPrice: 0, maxPrice: 50000 });
        expect(screen.getByLabelText('Categoria A')).toBeChecked();
        expect(container.querySelector('#price-1')).toBeChecked();
    });

    it('removes chips and resets categories and price independently', async () => {
        const { container } = renderShop('?categoryIds=7&categoryIds=8&minPrice=0&maxPrice=50000');
        await screen.findByLabelText('Categoria A');
        fireEvent.click(screen.getByRole('button', { name: /: Categoria A$/ }));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('', 0, 20,
            { categoryIds: ['8'], minPrice: 0, maxPrice: 50000 }));
        fireEvent.click(container.querySelector('#category-all'));
        fireEvent.click(container.querySelector('#price-all'));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('', 0, 20,
            { categoryIds: [], minPrice: null, maxPrice: null }));
    });

    it('supports existing category links and browser back navigation', async () => {
        const { container } = renderShop('?name=10gr&category_id=7');
        await screen.findByLabelText('Categoria A');
        expect(screen.getByLabelText('Categoria A')).toBeChecked();
        fireEvent.click(container.querySelector('#price-2'));
        await waitFor(() => expect(marketplaceService.list).toHaveBeenLastCalledWith('10gr', 0, 20,
            { categoryIds: ['7'], minPrice: 50000, maxPrice: 100000 }));
        fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
        await waitFor(() => expect(container.querySelector('#price-all')).toBeChecked());
        expect(container.querySelector('#product-name-filter')).toHaveValue('10gr');
        expect(screen.getByLabelText('Categoria A')).toBeChecked();
    });

    it('retains a way back when stock changes leave the current page empty', async () => {
        marketplaceService.list.mockImplementation(async (_search, page) => ({
            content: page ? [] : [{ cepaId: 'strain', nombre: 'Tangerine', precioDesde: 8000,
                presentaciones: [{ presentacionId: 'p1' }] }],
            page, totalPages: page ? 1 : 2, totalElements: page ? 1 : 21,
        }));
        renderShop();
        fireEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));
        const previous = await screen.findByRole('button', { name: 'Anterior' });
        await waitFor(() => expect(previous).toBeEnabled());
        fireEvent.click(previous);
        expect(await screen.findByRole('link', { name: /Tangerine/ })).toBeInTheDocument();
    });
});
