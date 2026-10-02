import { afterEach, describe, expect, it, vi } from 'vitest';
import cartService from '../../services/CartService';
import orderService from '../../services/OrderService';
import ShoppingCarComponent, { createWhatsAppCheckoutUrl } from './ShoppingCarComponent';

afterEach(() => {
    vi.restoreAllMocks();
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

    it('opens checkout in a new tab without replacing the cart', async () => {
        vi.spyOn(cartService, 'getCart').mockReturnValue([
            { id: '1', name: 'Mochila', price: 10, quantity: 1 },
        ]);
        vi.spyOn(cartService, 'getSubtotal').mockReturnValue(10);
        vi.spyOn(cartService, 'getTaxAmount').mockReturnValue(1.6);
        vi.spyOn(cartService, 'getTotal').mockReturnValue(11.6);
        const clearCartSpy = vi.spyOn(cartService, 'clearCart').mockImplementation(() => {});
        const createOrderSpy = vi.spyOn(orderService, 'createOrder').mockResolvedValue({ id: 1 });
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        const component = new ShoppingCarComponent({});
        component.setState = (nextState) => {
            component.state = { ...component.state, ...nextState };
        };

        await component.handleCheckout({ preventDefault: vi.fn() });

        expect(createOrderSpy).toHaveBeenCalledOnce();
        expect(openSpy).toHaveBeenCalledWith(
            expect.stringContaining('https://wa.me/'),
            '_blank',
            'noopener,noreferrer'
        );
        expect(clearCartSpy).toHaveBeenCalledOnce();
        expect(component.state.isOrderConfirmed).toBe(true);
    });

    it('keeps the cart when the order cannot be saved', async () => {
        vi.spyOn(cartService, 'getCart').mockReturnValue([
            { id: '1', name: 'Mochila', price: 10, quantity: 1 },
        ]);
        vi.spyOn(cartService, 'getSubtotal').mockReturnValue(10);
        vi.spyOn(cartService, 'getTaxAmount').mockReturnValue(1.6);
        vi.spyOn(cartService, 'getTotal').mockReturnValue(11.6);
        const clearCartSpy = vi.spyOn(cartService, 'clearCart').mockImplementation(() => {});
        vi.spyOn(orderService, 'createOrder').mockRejectedValue(new Error('fail'));
        vi.stubGlobal('alert', vi.fn());
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        const component = new ShoppingCarComponent({});

        await component.handleCheckout({ preventDefault: vi.fn() });

        expect(openSpy).not.toHaveBeenCalled();
        expect(clearCartSpy).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it('returns to the welcome page when confirmation is accepted', () => {
        const navigate = vi.fn();
        const component = new ShoppingCarComponent({ navigate });

        component.handleConfirmationAccept();

        expect(navigate).toHaveBeenCalledWith('/');
    });
});