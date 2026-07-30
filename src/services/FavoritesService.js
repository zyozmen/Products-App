const CART_STORAGE_KEY = 'growShopCartItems';
export const DEFAULT_TAX_RATE = 0.16;

class CartService {
    constructor() {
        this.listeners = [];
        this.items = this.loadCart();
    }

    loadCart() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
        this.notifyListeners();
    }

    notifyListeners() {
        const cart = this.getCart();
        this.listeners.forEach((listener) => listener(cart));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((registered) => registered !== listener);
        };
    }

    getCart() {
        return this.items.map((item) => ({ ...item }));
    }

    addToCart(product, quantity = 1) {
        const productId = String(product.id);
        const normalizedQuantity = Math.max(1, Number(quantity) || 1);
        const existingItem = this.items.find((item) => item.id === productId);

        if (existingItem) {
            existingItem.quantity += normalizedQuantity;
        } else {
            this.items.push({
                id: productId,
                name: String(product.name ?? ''),
                price: Number(product.price ?? 0),
                image: String(product.image ?? `/img/product-${productId}.jpg`),
                quantity: normalizedQuantity,
            });
        }

        this.saveCart();
    }

    removeFromCart(productId) {
        this.items = this.items.filter((item) => item.id !== String(productId));
        this.saveCart();
    }

    updateQuantity(productId, quantity) {
        const normalizedQuantity = Math.max(1, Number(quantity) || 1);
        const item = this.items.find((item) => item.id === String(productId));
        if (item) {
            item.quantity = normalizedQuantity;
            this.saveCart();
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    getTaxAmount(taxRate = DEFAULT_TAX_RATE) {
        return this.getSubtotal() * taxRate;
    }

    getTotal(taxRate = DEFAULT_TAX_RATE) {
        return this.getSubtotal() + this.getTaxAmount(taxRate);
    }
}

export default new CartService();
