import { useState } from 'react';
import cartService from '../../../services/CartService.js';
import useTranslation from '../../../hooks/useTranslation.js';
import { Button, Input } from '../../ui/shadcn';
import ConfirmationModal from '../../ui/ConfirmationModal';

function CartControllsComponent({ product }) {
    const t = useTranslation();
    const [quantity, setQuantity] = useState(1);
    const [isProductAdded, setIsProductAdded] = useState(false);
    const changeQuantity = (event) => {
        const value = Number(event.target.value);
        if (Number.isInteger(value) && value > 0) setQuantity(value);
        else if (event.target.value === '') setQuantity('');
    };
    const addToCart = () => {
        if (!product?.id || !Number.isInteger(quantity) || quantity < 1) return;
        cartService.addToCart({
            id: product.id,
            name: product.name,
            price: product.price?.current ?? 0,
            image: product.foto_principal || '/img/no_image.jpg',
        }, quantity);
        setQuantity(1);
        setIsProductAdded(true);
    };

    return (
        <>
            <div className="hu-flex hu-flex-wrap hu-items-center hu-gap-3">
                <div className="hu-flex hu-items-center">
                    <Button type="button" className="hu-rounded-r-none hu-px-3" aria-label={t('decrease_quantity')} onClick={() => setQuantity((current) => Math.max(1, (Number(current) || 1) - 1))}>−</Button>
                    <Input
                        className="hu-w-20 hu-rounded-none hu-text-center"
                        type="number"
                        min="1"
                        step="1"
                        aria-label={t('quantity')}
                        value={quantity}
                        onChange={changeQuantity}
                    />
                    <Button type="button" className="hu-rounded-l-none hu-px-3" aria-label={t('increase_quantity')} onClick={() => setQuantity((current) => (Number(current) || 0) + 1)}>+</Button>
                </div>
                <Button type="button" onClick={addToCart}>
                    <i className="fa fa-shopping-cart" aria-hidden="true" />
                    {t('add_to_cart')}
                </Button>
            </div>
            {isProductAdded && (
                <ConfirmationModal
                    title={t('product_added_to_cart')}
                    acceptLabel={t('accept')}
                    onAccept={() => setIsProductAdded(false)}
                />
            )}
        </>
    );
}

export default CartControllsComponent;
