import React, { Component } from "react";
import productosService from "../../../services/ProductosService.js";
import translationService from "../../../services/TranslationService.js";

const createInitialForm = () => ({
    name: "",
    description: "",
    sku: "",
    slug: "",
    status: "ACTIVE",
    price: "",
    originalPrice: "",
    currency: "USD",
    taxInclusive: false,
});

class CreateProduct extends Component {
    constructor(props) {
        super(props);
        this.state = {
            form: createInitialForm(),
            error: "",
            isSaving: false,
            currentLanguage: translationService.getLanguage(),
        };

        this.unsubscribeFromLanguage = null;
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleChange(event) {
        const { name, value, type, checked } = event.target;

        this.setState((prevState) => ({
            form: {
                ...prevState.form,
                [name]: type === "checkbox" ? checked : value,
            },
        }));
    }

    handleSubmit(event) {
        event.preventDefault();

        const validationError = this.validateForm();
        if (validationError) {
            this.setState({ error: validationError });
            return;
        }

        this.setState({ error: "", isSaving: true });

        productosService.crearProducto(this.buildPayload())
            .then((product) => {
                const productId = product.id || product.product_id;

                this.setState({ form: createInitialForm(), isSaving: false });

                if (productId) {
                    this.props.navigate(`/product/${productId}`);
                    return;
                }

                this.props.navigate("/shop");
            })
            .catch((error) => {
                const errorMessage = error.response?.data?.message
                    || error.message
                    || translationService.t("error_product_creation");

                this.setState({ error: errorMessage, isSaving: false });
            });
    }

    validateForm() {
        const { name, description, price, originalPrice } = this.state.form;
        const t = (key) => translationService.t(key);

        if (!name.trim()) {
            return t('error_product_name_required');
        }

        if (!description.trim()) {
            return t('error_product_description_required');
        }

        if (Number(price) <= 0) {
            return t('error_current_price_positive');
        }

        if (originalPrice && Number(originalPrice) < Number(price)) {
            return t('error_original_price_minimum');
        }

        return "";
    }

    buildPayload() {
        const { form } = this.state;
        const currentPrice = Number(form.price);
        const originalPrice = form.originalPrice ? Number(form.originalPrice) : currentPrice;

        return {
            name: form.name.trim(),
            nombre: form.name.trim(),
            description: form.description.trim(),
            descripcion: form.description.trim(),
            sku: form.sku.trim(),
            slug: form.slug.trim() || this.createSlug(form.name),
            status: form.status,
            price: {
                current: currentPrice,
                original: originalPrice,
                currency: form.currency,
                tax_inclusive: form.taxInclusive,
            },  
            precio: currentPrice,
        };
    }

    createSlug(name) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    render() {
        const { form, error, isSaving } = this.state;
        const t = (key) => translationService.t(key);

        return (
            <div className="container-fluid pt-5">
                <div className="row px-xl-5 justify-content-center">
                    <div className="col-lg-8">
                        <div className="bg-light p-30 mb-5">
                            <h2 className="mb-4">{t('create_product_title')}</h2>
                            <p className="mb-4">{t('create_product_subtitle')}</p>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={this.handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="name">{t('name_label')}</label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            className="form-control"
                                            value={form.name}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="sku">{t('sku_label')}</label>
                                        <input
                                            id="sku"
                                            name="sku"
                                            type="text"
                                            className="form-control"
                                            value={form.sku}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">{t('description_label')}</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="form-control"
                                        rows="4"
                                        value={form.description}
                                        onChange={this.handleChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="slug">{t('slug_label')}</label>
                                        <input
                                            id="slug"
                                            name="slug"
                                            type="text"
                                            className="form-control"
                                            value={form.slug}
                                            onChange={this.handleChange}
                                            placeholder={t('generated_slug_placeholder')}
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="status">{t('status_label')}</label>
                                        <select
                                            id="status"
                                            name="status"
                                            className="form-control"
                                            value={form.status}
                                            onChange={this.handleChange}
                                        >
                                            <option value="ACTIVE">{t('status_active')}</option>
                                            <option value="DRAFT">{t('status_draft')}</option>
                                            <option value="INACTIVE">{t('status_inactive')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-4">
                                        <label htmlFor="price">{t('current_price_label')}</label>
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control"
                                            value={form.price}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label htmlFor="originalPrice">{t('original_price')}</label>
                                        <input
                                            id="originalPrice"
                                            name="originalPrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control"
                                            value={form.originalPrice}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label htmlFor="currency">{t('currency_label')}</label>
                                        <input
                                            id="currency"
                                            name="currency"
                                            type="text"
                                            className="form-control"
                                            value={form.currency}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group form-check mb-4">
                                    <input
                                        id="taxInclusive"
                                        name="taxInclusive"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={form.taxInclusive}
                                        onChange={this.handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="taxInclusive">
                                        {t('tax_inclusive_label')}
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-primary px-4" disabled={isSaving}>
                                    {isSaving ? t('saving_btn') : t('create_product_btn')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CreateProduct;