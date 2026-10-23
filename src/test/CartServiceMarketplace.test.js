import { describe, expect, it } from 'vitest';
import { CartService } from '../services/CartService.js';

describe('marketplace cart migration', () => {
    it('discards legacy catalog entries and exposes a one-time notice', () => {
        localStorage.setItem('growShopCartItems', JSON.stringify([
            { id: 'legacy-1', name: 'Old product', price: 10, quantity: 1 },
            { id: 'presentation-1', presentationId: 'presentation-1', name: 'New product', price: 20, quantity: 1 },
        ]));
        localStorage.removeItem('growShopCartMigrationNotified');

        const service = new CartService();

        expect(service.getCart().map((item) => item.id)).toEqual(['presentation-1']);
        expect(service.consumeMigrationNotice()).toBe(true);
        expect(service.consumeMigrationNotice()).toBe(false);
        expect(JSON.parse(localStorage.getItem('growShopCartItems'))).toHaveLength(1);
    });

    it('keeps different presentations separate and caps quantity at each stock', () => {
        localStorage.setItem('growShopCartItems', '[]');
        const service = new CartService();
        service.addToCart({ id: 'a', presentationId: 'a', name: 'Same product', price: 10, stock: 2 }, 2);
        service.addToCart({ id: 'b', presentationId: 'b', name: 'Same product', price: 10, stock: 5 }, 1);
        service.addToCart({ id: 'a', presentationId: 'a', name: 'Same product', price: 10, stock: 2 }, 1);

        expect(service.getCart().map((item) => [item.id, item.quantity])).toEqual([['a', 2], ['b', 1]]);
    });
});
