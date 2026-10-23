import React, { Component, useState } from "react";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import HeaderComponent from "../dashboard/HeaderComponent";
import FooterComponent from "../dashboard/FooterComponent";
import navigationComponent from "../navigation/NavigationComponent";
import cartService, { DEFAULT_TAX_RATE } from "../../services/CartService";
import { marketplaceService } from '../../services/marketplaceService.ts';
import translationService from "../../services/TranslationService";
import AuthenticationService from "../../services/AuthenticationService";
import { formatCOP } from "../../Interfaces/ProductInterface";
import ConfirmationModal from "../ui/ConfirmationModal";
import useTranslation from '../../hooks/useTranslation.js';
import { useOrderMutations } from '../../hooks/useApiQueries.ts';
import { checkoutSchema } from '../../schemas/checkout';
import { Button, Card, ErrorNotice, Field, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/shadcn';

const whatsappPhoneNumber = String(import.meta.env.VITE_WHATSAPP_NUMBER ?? '573124058166').trim();
const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

export const createWhatsAppCheckoutUrl = ({ items, phoneNumber, subtotal, taxAmount, total, delivery = {} }) => {
    const orderLines = items.map((item) =>
        `- ${item.name} x${item.quantity}: ${formatCOP(item.price * item.quantity)}`
    );
    const message = [
        'Hola, quiero realizar este pedido:',
        ...orderLines,
        '',
        'Datos de entrega:',
        `Receptor: ${delivery.recipientName ?? ''}`,
        `Direccion: ${delivery.address ?? ''}`,
        delivery.addressComplement ? `Complemento: ${delivery.addressComplement}` : null,
        `Telefono de contacto: ${delivery.contactPhone ?? ''}`,
        '',
        `Total: ${formatCOP(total)}`,
    ].filter((line) => line !== null).join('\n');
    const normalizedPhoneNumber = String(phoneNumber ?? '').replace(/\D/g, '');

    return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`;
};

export function CheckoutForm({ items, subtotal, taxAmount, total, onOrderConfirmed }) {
    const t = useTranslation();
    const { create } = useOrderMutations();
    const user = AuthenticationService.getLoggedInUser();
    const fullName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim();
    const [isOtherRecipient, setIsOtherRecipient] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const form = useForm({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            recipientName: fullName,
            address: user?.direccion || '',
            addressComplement: '',
            contactPhone: user?.telefono || '',
        },
    });

    const fieldError = (name) => {
        const message = form.formState.errors[name]?.message;
        return message ? t(message) : undefined;
    };

    const onSubmit = form.handleSubmit(async (values) => {
        setSubmitError('');
        const delivery = {
            recipientName: values.recipientName,
            address: values.address,
            addressComplement: values.addressComplement,
            contactPhone: values.contactPhone,
        };
        try {
            await create.mutateAsync({ items, delivery, subtotal, taxAmount, total });
        } catch (error) {
            const message = error instanceof Error ? error.message : t('checkout_create_error');
            if (/precio|total.*coincide|presentaci|stock|disponible/i.test(message) &&
                items.every((item) => item.presentationId && item.cepaId)) {
                try {
                    await Promise.all(items.map(async (item) => {
                        try {
                            const detail = await marketplaceService.detail(item.cepaId, item.presentationId);
                            const current = detail.presentaciones.find((option) => option.presentacionId === item.presentationId);
                            cartService.refreshPresentation(item.presentationId, current ? {
                                strainName: detail.nombre,
                                presentationName: current.nombre,
                                sku: current.sku,
                                content: current.contenidoUnidad,
                                baseUnit: current.unidadBase,
                                price: current.precioVenta,
                                stock: current.stockDisponible,
                                fotografia: current.fotografia || detail.fotografia,
                            } : null);
                        } catch (refreshError) {
                            if (refreshError?.response?.status === 404) {
                                cartService.refreshPresentation(item.presentationId, null);
                                return;
                            }
                            throw refreshError;
                        }
                    }));
                } catch (refreshError) {
                    const refreshMessage = refreshError instanceof Error ? refreshError.message : 'Error de actualización desconocido.';
                    setSubmitError(`${message} No se pudo revalidar el catálogo: ${refreshMessage}. La orden no se reenvió.`);
                    return;
                }
                setSubmitError(`${message} Se actualizaron precio y disponibilidad del carrito; revísalos y vuelve a confirmar. La orden no se reenvió.`);
            } else {
                setSubmitError(message);
            }
            return;
        }

        const url = createWhatsAppCheckoutUrl({
            items,
            phoneNumber: whatsappPhoneNumber,
            subtotal,
            taxAmount,
            total,
            delivery,
        });
        window.open(url, '_blank', 'noopener,noreferrer');
        onOrderConfirmed();
    });

    return (
        <form className="hu-grid hu-gap-4" onSubmit={onSubmit} noValidate>
            <div className="hu-border-b hu-border-slate-200 hu-pb-4">
                <h2 className="hu-mb-3 hu-mt-0 hu-text-base hu-font-semibold">{t('delivery_details')}</h2>
                <label className="hu-mb-4 hu-flex hu-cursor-pointer hu-items-center hu-gap-2 hu-text-sm hu-font-medium">
                    <input
                        type="checkbox"
                        checked={isOtherRecipient}
                        onChange={(event) => {
                            const checked = event.target.checked;
                            setIsOtherRecipient(checked);
                            form.setValue('recipientName', checked ? '' : fullName, { shouldValidate: form.formState.isSubmitted });
                        }}
                    />
                    {t('other_recipient')}
                </label>
                <div className="hu-grid hu-gap-4">
                    {(isOtherRecipient || !fullName) && (
                        <Field label={`${t('other_recipient_name')} *`} htmlFor="delivery-recipient" error={fieldError('recipientName')}>
                            <Input id="delivery-recipient" autoComplete="name" aria-invalid={Boolean(form.formState.errors.recipientName)} {...form.register('recipientName')} />
                        </Field>
                    )}
                    <Field label={`${t('address')} *`} htmlFor="delivery-address" error={fieldError('address')}>
                        <Input id="delivery-address" autoComplete="street-address" aria-invalid={Boolean(form.formState.errors.address)} {...form.register('address')} />
                    </Field>
                    <Field label={t('address_complement')} htmlFor="delivery-complement">
                        <Input id="delivery-complement" placeholder={t('cart_address_example')} {...form.register('addressComplement')} />
                    </Field>
                    <Field label={`${t('contact_phone')} *`} htmlFor="delivery-phone" error={fieldError('contactPhone')}>
                        <Input id="delivery-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(form.formState.errors.contactPhone)} {...form.register('contactPhone')} />
                    </Field>
                </div>
            </div>
            {items.some((item) => !item.presentationId) && <ErrorNotice>Este artículo pertenece al catálogo anterior y no se puede comprar desde el marketplace. Retíralo y selecciona una presentación disponible.</ErrorNotice>}
            {items.some((item) => item.unavailable || (Number.isFinite(item.stock) && item.quantity > item.stock)) && <ErrorNotice>Una presentación ya no tiene disponibilidad suficiente. Ajusta la cantidad o retírala antes de continuar.</ErrorNotice>}
            {submitError && <ErrorNotice>{submitError}</ErrorNotice>}
            <div className="hu-grid hu-gap-2 hu-border-b hu-border-slate-200 hu-pb-2">
                <div className="hu-flex hu-justify-between hu-text-sm">
                    <span>{t('subtotal')}</span>
                    <strong>{formatCOP(subtotal)}</strong>
                </div>
                <div className="hu-flex hu-justify-between hu-text-sm">
                    <span>{t('tax')} ({(DEFAULT_TAX_RATE * 100).toFixed(0)}%)</span>
                    <strong>{formatCOP(taxAmount)}</strong>
                </div>
                <div className="hu-flex hu-justify-between hu-pt-2 hu-text-base">
                    <strong>{t('total')}</strong>
                    <strong>{formatCOP(total)}</strong>
                </div>
            </div>
            <Button type="submit" className="hu-w-full" disabled={items.length === 0 || items.some((item) => !item.presentationId || item.unavailable || (Number.isFinite(item.stock) && item.quantity > item.stock)) || form.formState.isSubmitting || create.isPending}>
                {form.formState.isSubmitting || create.isPending ? t('saving_btn') : t('proceed_checkout')}
            </Button>
        </form>
    );
}

class ShoppingCarComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: cartService.getCart(),
            migrationNotice: cartService.consumeMigrationNotice(),
            isOrderConfirmed: false,
            currentLanguage: translationService.getLanguage(),
        };
        this.handleRemove = this.handleRemove.bind(this);
        this.handleIncrement = this.handleIncrement.bind(this);
        this.handleDecrement = this.handleDecrement.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.handleOrderConfirmed = this.handleOrderConfirmed.bind(this);
        this.handleConfirmationAccept = this.handleConfirmationAccept.bind(this);
        this.unsubscribe = null;
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribe = cartService.subscribe((items) => this.setState({ items }));
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });

    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleRemove(productId) {
        cartService.removeFromCart(productId);
    }

    handleIncrement(item) {
        cartService.updateQuantity(item.id, item.quantity + 1);
    }

    handleDecrement(item) {
        if (item.quantity > 1) {
            cartService.updateQuantity(item.id, item.quantity - 1);
        }
    }

    handleQuantityChange(item, value) {
        const quantity = Number(value);
        if (Number.isFinite(quantity) && quantity > 0) {
            cartService.updateQuantity(item.id, quantity);
        }
    }

    handleOrderConfirmed() {
        cartService.clearCart();
        this.setState({ isOrderConfirmed: true });
    }

    handleConfirmationAccept() {
        this.props.navigate('/');
    }

    render() {
        const isUserLoggedIn = AuthenticationService.isUserLoggedIn();
        const { items } = this.state;
        const subtotal = cartService.getSubtotal();
        const taxAmount = cartService.getTaxAmount();
        const total = cartService.getTotal();
        const t = (key) => translationService.t(key);

        return (
            <div className="hu-flex hu-min-h-screen hu-flex-col hu-bg-slate-50 hu-text-slate-900">
                <HeaderComponentWithNavigation />
                <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                    <div className="hu-mb-6">
                        <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight">{t('cart_summary')}</h1>
                    </div>
                    {this.state.migrationNotice && (
                        <div className="hu-mb-4 hu-rounded-lg hu-border hu-border-amber-200 hu-bg-amber-50 hu-p-4 hu-text-sm hu-text-amber-900" role="status">
                            El carrito anterior usaba productos del catálogo antiguo. Esos artículos se retiraron porque ya no se pueden asociar con una presentación comprable.
                        </div>
                    )}
                    <div className="hu-grid hu-items-start hu-gap-5 lg:hu-grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                        <Card className="hu-overflow-hidden">
                            <div className="hu-overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:hu-bg-slate-50/10">
                                            <TableHead>{t('product')}</TableHead>
                                            <TableHead>{t('price')}</TableHead>
                                            <TableHead>{t('quantity')}</TableHead>
                                            <TableHead>{t('total')}</TableHead>
                                            <TableHead>{t('remove')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan="5" className="hu-py-8 hu-text-center hu-text-slate-500">
                                                {t('empty_cart')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="hu-min-w-[220px]">
                                                <img
                                                    src={String(item.image ?? '').trim() || '/img/no_image.jpg'}
                                                    alt={item.name}
                                                    className="hu-mr-3 hu-inline-block hu-h-14 hu-w-14 hu-rounded-lg hu-object-cover"
                                                />
                                                <span className="hu-font-medium">{item.name}</span>
                                                {item.sku && <span className="hu-ml-2 hu-text-xs hu-text-slate-500">SKU: {item.sku}</span>}
                                            </TableCell>
                                            <TableCell>{formatCOP(item.price)}</TableCell>
                                            <TableCell>
                                                <div className="hu-flex hu-w-32 hu-items-center">
                                                    <Button type="button" variant="secondary" className="hu-rounded-r-none hu-px-3 hu-py-2" aria-label={`${t('decrease_quantity')} ${item.name}`} onClick={() => this.handleDecrement(item)} disabled={item.quantity <= 1}>−</Button>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        aria-label={`${t('quantity')} ${item.name}`}
                                                        className="hu-rounded-none hu-p-2 hu-text-center"
                                                        value={item.quantity}
                                                        onChange={(event) => this.handleQuantityChange(item, event.target.value)}
                                                    />
                                                    <Button type="button" variant="secondary" className="hu-rounded-l-none hu-px-3 hu-py-2" aria-label={`${t('increase_quantity')} ${item.name}`} onClick={() => this.handleIncrement(item)}>+</Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hu-font-semibold">{formatCOP(item.price * item.quantity)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="destructive" className="hu-px-3 hu-py-2" aria-label={`${t('remove')} ${item.name}`} onClick={() => this.handleRemove(item.id)}>×</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                        <Card className="hu-p-5">
                            <h2 className="hu-mb-4 hu-mt-0 hu-text-lg hu-font-bold">{t('cart_summary')}</h2>
                                {!isUserLoggedIn ? (
                                    <div className="hu-grid hu-justify-items-center hu-gap-4 hu-py-4 hu-text-center">
                                        <div className="hu-w-full hu-rounded-lg hu-border hu-border-amber-200 hu-bg-amber-50 hu-p-3 hu-text-sm hu-text-amber-900" role="status">
                                            {t('checkout_login_required')}
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => this.props.navigate('/login')}
                                        >
                                            {t('sign_in')}
                                        </Button>
                                    </div>
                                ) : (
                                    <CheckoutForm
                                        items={items}
                                        subtotal={subtotal}
                                        taxAmount={taxAmount}
                                        total={total}
                                        onOrderConfirmed={this.handleOrderConfirmed}
                                    />
                                )}
                        </Card>
                    </div>
                </main>
                <FooterComponent />
                {this.state.isOrderConfirmed && (
                    <ConfirmationModal
                        title={t('thank_you_purchase')}
                        message={t('order_opened_whatsapp')}
                        acceptLabel={t('accept')}
                        onAccept={this.handleConfirmationAccept}
                    />
                )}
            </div>
        );
    }
}

export default ShoppingCarComponent;
