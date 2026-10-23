const CART_STORAGE_KEY = 'growShopCartItems';
const CART_MIGRATION_NOTICE_KEY = 'growShopCartMigrationNotified';
export const DEFAULT_TAX_RATE = 0.16;

export class CartService {
    constructor() {
        this.listeners = [];
        this.migrationNoticePending = false;
        this.items = this.loadCart();
    }

    loadCart() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) return [];
            const currentItems = parsed.filter((item) => item && item.presentationId);
            if (currentItems.length !== parsed.length) {
                if (localStorage.getItem(CART_MIGRATION_NOTICE_KEY) !== 'true') {
                    this.migrationNoticePending = true;
                    localStorage.setItem(CART_MIGRATION_NOTICE_KEY, 'true');
                }
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentItems));
            }
            return currentItems.map((item) => ({ ...item, id: String(item.presentationId) }));
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

    consumeMigrationNotice() {
        const pending = this.migrationNoticePending;
        this.migrationNoticePending = false;
        return pending;
    }

    addToCart(product, quantity = 1) {
        const productId = String(product.presentationId ?? product.id);
        const stockLimit = Number.isFinite(Number(product.stock)) ? Number(product.stock) : Number.MAX_SAFE_INTEGER;
        if (stockLimit < 1) return;
        const normalizedQuantity = Math.max(1, Math.min(stockLimit, Number(quantity) || 1));
        const existingItem = this.items.find((item) => item.id === productId &&
            (product.presentationId ? item.presentationId === product.presentationId : !item.presentationId));

        if (existingItem) {
            existingItem.quantity = Math.min(stockLimit, existingItem.quantity + normalizedQuantity);
            existingItem.name = String(product.name ?? existingItem.name);
            existingItem.price = Number(product.price ?? existingItem.price);
            existingItem.image = String(product.image ?? existingItem.image);
            existingItem.stock = product.stock ?? existingItem.stock;
            existingItem.unavailable = false;
            for (const property of ['cepaId', 'presentationId', 'strainName', 'presentationName', 'sku', 'content', 'baseUnit']) {
                if (product[property] !== undefined) existingItem[property] = product[property];
            }
        } else {
            const image = String(product.image ?? '').trim();
            this.items.push({
                id: productId,
                cepaId: product.cepaId,
                presentationId: product.presentationId,
                strainName: product.strainName,
                presentationName: product.presentationName,
                sku: product.sku,
                content: product.content,
                baseUnit: product.baseUnit,
                stock: product.stock,
                name: String(product.name ?? ''),
                price: Number(product.price ?? 0),
                image: image || '/img/no_image.jpg',
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
            const stockLimit = Number.isFinite(Number(item.stock)) ? Number(item.stock) : Number.MAX_SAFE_INTEGER;
            item.quantity = stockLimit > 0 ? Math.min(stockLimit, normalizedQuantity) : normalizedQuantity;
            this.saveCart();
        }
    }

    refreshPresentation(productId, product) {
        const item = this.items.find((cartItem) => cartItem.presentationId === String(productId));
        if (!item) return;
        if (!product) {
            item.stock = 0;
            item.unavailable = true;
            this.saveCart();
            return;
        }
        const image = product.fotografia?.filepart
            ? `data:image/${product.fotografia.extension === 'jpg' || product.fotografia.extension === 'jpeg' ? 'jpeg' : product.fotografia.extension};base64,${product.fotografia.filepart}`
            : '/img/no_image.jpg';
        item.name = `${product.strainName} · ${product.presentationName}`;
        item.strainName = product.strainName;
        item.presentationName = product.presentationName;
        item.sku = product.sku;
        item.content = product.content;
        item.baseUnit = product.baseUnit;
        item.price = Number(product.price);
        item.image = image;
        item.stock = product.stock;
        item.unavailable = false;
        this.saveCart();
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
