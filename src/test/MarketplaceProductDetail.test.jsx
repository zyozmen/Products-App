import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MarketplaceProductDetail from '../components/shop/MarketplaceProductDetail.jsx';
import { ProductDetailContent } from '../components/shop/ProductDetail/ProductDetails.jsx';
import { marketplaceService } from '../services/marketplaceService.ts';
import cartService from '../services/CartService.js';
import translationService from '../services/TranslationService.js';
import { formatCOP } from '../Interfaces/ProductInterface.js';

const detail = {
    cepaId: 'strain-1',
    nombre: 'Tangerine',
    fotografia: { nombre: 'cepa.webp', extension: 'webp', filepart: 'YQ==' },
    precioDesde: 8000,
    presentacionSeleccionadaId: 'presentation-5',
    presentaciones: [
        {
            presentacionId: 'presentation-5', nombre: 'Bolsa 5 g', sku: 'TAN-5',
            contenidoUnidad: 5, unidadBase: 'GRAMOS', precioVenta: 8000,
            stockDisponible: 3, fotografia: null,
        },
        {
            presentacionId: 'presentation-10', nombre: 'Bolsa 10 g', sku: 'TAN-10',
            contenidoUnidad: 10, unidadBase: 'GRAMOS', precioVenta: 15000,
            stockDisponible: 5,
            fotografia: { nombre: 'bolsa.webp', extension: 'webp', filepart: 'Yg==' },
        },
    ],
};

function CurrentPath() {
    return <output data-testid="current-path">{useLocation().pathname}</output>;
}

function renderMarketplace() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={['/producto/strain-1/presentation-5']}>
                <Routes>
                    <Route path="/producto/:cepaId/:presentacionId" element={<><MarketplaceProductDetail /><CurrentPath /></>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    sessionStorage.clear();
    cartService.clearCart();
    translationService.setLanguage('ES');
    vi.spyOn(marketplaceService, 'detail').mockResolvedValue(detail);
});

afterEach(() => {
    cleanup();
    cartService.clearCart();
    vi.restoreAllMocks();
});

describe('marketplace product detail', () => {
    it('keeps the original image carousel and cart controls, with selectable presentation radios', async () => {
        renderMarketplace();
        await screen.findByRole('heading', { name: 'Tangerine' });

        const image = screen.getByRole('img', { name: 'Imagen del producto 1' });
        expect(image.closest('[aria-roledescription="carousel"]')).not.toBeNull();
        expect(image).toHaveAttribute('src', 'data:image/webp;base64,YQ==');
        expect(screen.getByRole('group', { name: 'Presentaciones' })).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(2);
        expect(screen.getByRole('radio', { name: /Bolsa 5 g/ })).toBeChecked();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue(1);
    });

    it('calculates the total from the selected unit price and quantity using the original controls', async () => {
        renderMarketplace();
        await screen.findByRole('heading', { name: 'Tangerine' });

        fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
        expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue(2);
        expect(screen.getByText(formatCOP(16000))).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad' }));
        expect(screen.getByText(formatCOP(8000))).toBeInTheDocument();
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad' }), { target: { value: '3' } });
        expect(screen.getByText(formatCOP(24000))).toBeInTheDocument();
    });

    it('updates the radio selection, photo, URL and total without mixing presentation IDs', async () => {
        renderMarketplace();
        await screen.findByRole('heading', { name: 'Tangerine' });
        fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
        fireEvent.click(screen.getByRole('radio', { name: /Bolsa 10 g/ }));

        expect(screen.getByRole('radio', { name: /Bolsa 10 g/ })).toBeChecked();
        expect(screen.getByRole('radio', { name: /Bolsa 5 g/ })).not.toBeChecked();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/producto/strain-1/presentation-10');
        expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/webp;base64,Yg==');
        expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue(1);
        expect(screen.getByText(formatCOP(15000))).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
        expect(screen.getByText(formatCOP(30000))).toBeInTheDocument();
    });

    it('keeps the original confirmation dialog and stores the unit price with the selected quantity', async () => {
        renderMarketplace();
        await screen.findByRole('heading', { name: 'Tangerine' });
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad' }), { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: /Agregar al carrito/i }));

        expect(cartService.getCart()).toEqual([expect.objectContaining({
            id: 'presentation-5',
            cepaId: 'strain-1',
            presentationId: 'presentation-5',
            name: 'Tangerine · Bolsa 5 g',
            price: 8000,
            quantity: 3,
        })]);
        expect(screen.getByRole('alertdialog')).toHaveTextContent('Tu producto fue añadido al carrito');
        expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue(1);
        fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('limits the original quantity input and plus button to the selected stock', async () => {
        renderMarketplace();
        await screen.findByRole('heading', { name: 'Tangerine' });
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad' }), { target: { value: '99' } });

        expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue(3);
        expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled();
        expect(screen.getByText(formatCOP(24000))).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad' }));
        expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeEnabled();
    });

    it('preserves legacy categories, description and cart payload in the shared product layout', () => {
        const addToCart = vi.spyOn(cartService, 'addToCart');
        function LegacyDetail() {
            const [quantity, setQuantity] = useState(1);
            return <ProductDetailContent product={{
                id: 42, name: 'Producto original', price: { current: 2500 },
                categories: [{ name: 'Categoría original' }], description: 'Descripción original',
            }} quantity={quantity} onQuantityChange={setQuantity} />;
        }
        render(<MemoryRouter><LegacyDetail /></MemoryRouter>);

        expect(screen.getByText('Categoría original')).toBeInTheDocument();
        expect(screen.getByText('Descripción original')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).not.toHaveAttribute('max');
        fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
        expect(screen.getByText(formatCOP(5000))).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Agregar al carrito/i }));
        expect(addToCart).toHaveBeenCalledWith({
            id: 42, name: 'Producto original', price: 2500, image: '/img/no_image.jpg',
        }, 2);
    });
});
