import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import cartService from '../services/CartService';
import orderService from '../services/OrderService';
import { CheckoutForm, createWhatsAppCheckoutUrl } from '../components/cart/ShoppingCarComponent';

afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
});

const renderCheckout = (props = {}) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <CheckoutForm
                items={[{ id: '1', presentationId: '1', name: 'Mochila', price: 10, quantity: 1 }]}
                subtotal={10}
                taxAmount={1.6}
                total={11.6}
                onOrderConfirmed={vi.fn()}
                {...props}
            />
        </QueryClientProvider>,
    );
};

describe('cart product images', () => {
    it('uses the placeholder image when a product image is empty', () => {
        const productId = `image-fallback-${Date.now()}`;

        cartService.addToCart({
            id: productId,
            presentationId: productId,
            name: 'Product without image',
            price: 10,
            image: ' ',
        });

        const item = cartService.getCart().find((cartItem) => cartItem.id === productId);

        expect(item.image).toBe('/img/no_image.jpg');
        cartService.removeFromCart(productId);
    });
});

describe('createWhatsAppCheckoutUrl', () => {
    it('creates a WhatsApp link with the order and totals in the message', () => {
        const url = new URL(createWhatsAppCheckoutUrl({
            items: [{ name: 'Mochila & termo', price: 10, quantity: 2 }],
            phoneNumber: '+57 312 405 8166',
            subtotal: 20,
            taxAmount: 3.2,
            total: 23.2,
            delivery: {
                recipientName: 'Ana Perez',
                address: 'Calle 10 # 20-30',
                addressComplement: 'Casa 34, int. 4, apto. 204',
                contactPhone: '+57 300 123 4567',
            },
        }));

        expect(url.origin).toBe('https://wa.me');
        expect(url.pathname).toBe('/573124058166');
        expect(url.searchParams.get('text')).toContain('Mochila & termo x2: $20');
        expect(url.searchParams.get('text')).toContain('Receptor: Ana Perez');
        expect(url.searchParams.get('text')).toContain('Complemento: Casa 34, int. 4, apto. 204');
        expect(url.searchParams.get('text')).toContain('Telefono de contacto: +57 300 123 4567');
        expect(url.searchParams.get('text')).toContain('Total: $23');
    });

    it('saves the order, opens WhatsApp, and confirms checkout', async () => {
        const createOrderSpy = vi.spyOn(orderService, 'createOrder').mockResolvedValue({ id: 1 });
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onOrderConfirmed = vi.fn();
        renderCheckout({ onOrderConfirmed });

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.change(screen.getByLabelText(/Nombre de la persona que recibe/i), { target: { value: 'Ana Pérez' } });
        fireEvent.change(screen.getByLabelText('Dirección *'), { target: { value: 'Calle 10' } });
        fireEvent.change(screen.getByLabelText('Teléfono de contacto *'), { target: { value: '3001234567' } });
        fireEvent.click(screen.getByRole('button', { name: /Proceder al pago/i }));

        await waitFor(() => expect(createOrderSpy).toHaveBeenCalledOnce());
        expect(createOrderSpy).toHaveBeenCalledWith({
            items: [{ id: '1', presentationId: '1', name: 'Mochila', price: 10, quantity: 1 }],
            delivery: expect.objectContaining({
                recipientName: 'Ana Pérez',
                address: 'Calle 10',
                contactPhone: '3001234567',
            }),
            subtotal: 10,
            taxAmount: 1.6,
            total: 11.6,
        });
        await waitFor(() => expect(openSpy).toHaveBeenCalledWith(
            expect.stringContaining('https://wa.me/'),
            '_blank',
            'noopener,noreferrer',
        ));
        expect(onOrderConfirmed).toHaveBeenCalledOnce();
    });

    it('does not open WhatsApp or confirm when order creation fails', async () => {
        vi.spyOn(orderService, 'createOrder').mockRejectedValue(new Error('fail'));
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onOrderConfirmed = vi.fn();
        renderCheckout({ onOrderConfirmed });

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.change(screen.getByLabelText(/Nombre de la persona que recibe/i), { target: { value: 'Ana Pérez' } });
        fireEvent.change(screen.getByLabelText('Dirección *'), { target: { value: 'Calle 10' } });
        fireEvent.change(screen.getByLabelText('Teléfono de contacto *'), { target: { value: '3001234567' } });
        fireEvent.click(screen.getByRole('button', { name: /Proceder al pago/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('fail');
        expect(openSpy).not.toHaveBeenCalled();
        expect(onOrderConfirmed).not.toHaveBeenCalled();
    });

    it('validates delivery details before sending the order', async () => {
        const createOrderSpy = vi.spyOn(orderService, 'createOrder').mockResolvedValue({ id: 1 });
        renderCheckout();

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: /Proceder al pago/i }));

        expect(await screen.findAllByRole('alert')).toHaveLength(3);
        expect(createOrderSpy).not.toHaveBeenCalled();
    });
});