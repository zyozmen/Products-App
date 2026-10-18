import React, { Component } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import CategoryRow from "./CategoryRow.jsx";
import translationService from "../../../services/TranslationService.js";
import { useCategories, useProduct, useProductMutations } from "../../../hooks/useApiQueries.ts";
import { createProductSchema } from "./productSchema";
import {
    appendCategory,
    appendComment,
    buildProductPayload,
    createInitialForm,
    formFromProduct,
    removeCategoryAt,
    removeCommentAt,
    updateCategoryById,
    updateCategoryByName,
    updateCategoryField,
    updateCommentField,
    updateFlatField,
} from "./CreateProductHelper.js";

class CreateProductView extends Component {
    constructor(props) {
        super(props);
        this.errorAlertRef = React.createRef();
        this.state = {
            form: createInitialForm(),
            error: "",
            isSaving: false,
            availableCategories: [],
            categoriesError: "",
            currentLanguage: translationService.getLanguage(),
            principalImage: null,
            secundaryImages: [],
            principalImagePreview: "",
            secundaryImagePreviews: [],
            pendingDeleteFromStatus: null,
        };

        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.cancelDelete = this.cancelDelete.bind(this);
        this.confirmDelete = this.confirmDelete.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.focusErrorAlert = this.focusErrorAlert.bind(this);
        this.handleCategoryIdChange = this.handleCategoryIdChange.bind(this);
        this.handleCategoryNameChange = this.handleCategoryNameChange.bind(this);
        this.handlePrincipalImageChange = this.handlePrincipalImageChange.bind(this);
        this.handleSecundaryImagesChange = this.handleSecundaryImagesChange.bind(this);
        this.removePrincipalImage = this.removePrincipalImage.bind(this);
        this.removeSecundaryImage = this.removeSecundaryImage.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    focusErrorAlert() {
        if (!this.errorAlertRef.current) {
            return;
        }

        this.errorAlertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        this.errorAlertRef.current.focus({ preventScroll: true });
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });

        const productId = this.props.params?.productId;
        if (productId) {
            this.setState({ isSaving: true });
        }
        if (this.props.categoriesQuery.data) {
            this.setState({ availableCategories: this.props.categoriesQuery.data });
        } else if (this.props.categoriesQuery.isError) {
            this.setState({ categoriesError: translationService.t('categories_load_error') });
        }
        if (this.props.productQuery.data) {
            const form = formFromProduct(this.props.productQuery.data);
            this.props.formMethods.reset(form);
            this.setState({ form, isSaving: false });
        } else if (this.props.productQuery.isError) {
            this.setState({
                error: this.props.productQuery.error?.message || translationService.t('product_load_error'),
                isSaving: false,
            }, this.focusErrorAlert);
        }
    }

    componentDidUpdate(previousProps) {
        if (previousProps.categoriesQuery.data !== this.props.categoriesQuery.data && this.props.categoriesQuery.data) {
            this.setState({ availableCategories: this.props.categoriesQuery.data, categoriesError: '' });
        }
        if (previousProps.categoriesQuery.isError !== this.props.categoriesQuery.isError && this.props.categoriesQuery.isError) {
            this.setState({ categoriesError: translationService.t('categories_load_error') });
        }
        if (previousProps.productQuery.data !== this.props.productQuery.data && this.props.productQuery.data) {
            const form = formFromProduct(this.props.productQuery.data);
            this.props.formMethods.reset(form);
            this.setState({ form, isSaving: false });
        }
        if (previousProps.productQuery.isError !== this.props.productQuery.isError && this.props.productQuery.isError) {
            this.setState({
                error: this.props.productQuery.error?.message || translationService.t('product_load_error'),
                isSaving: false,
            }, this.focusErrorAlert);
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
        if (this.state.principalImagePreview) {
            URL.revokeObjectURL(this.state.principalImagePreview);
        }
        this.state.secundaryImagePreviews.forEach((url) => {
            URL.revokeObjectURL(url);
        });
    }

    handlePrincipalImageChange(event) {
        const file = event.target.files[0];
        if (file) {
            if (this.state.principalImagePreview) {
                URL.revokeObjectURL(this.state.principalImagePreview);
            }
            this.setState({
                principalImage: file,
                principalImagePreview: URL.createObjectURL(file)
            });
        }
    }

    handleSecundaryImagesChange(event) {
        const files = Array.from(event.target.files);
        const currentCount = this.state.secundaryImages.length;
        if (currentCount + files.length > 5) {
            const t = (key) => translationService.t(key);
            this.setState({
                error: t("cannot_add_more_secondary_img")
            }, this.focusErrorAlert);
            return;
        }

        const newImages = [...this.state.secundaryImages];
        const newPreviews = [...this.state.secundaryImagePreviews];

        files.forEach((file) => {
            newImages.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        this.setState({
            secundaryImages: newImages,
            secundaryImagePreviews: newPreviews
        });
    }

    removePrincipalImage() {
        if (this.state.principalImagePreview) {
            URL.revokeObjectURL(this.state.principalImagePreview);
        }
        this.setState({
            principalImage: null,
            principalImagePreview: ""
        });
    }

    removeSecundaryImage(index) {
        const newImages = this.state.secundaryImages.filter((_, i) => i !== index);
        const newPreviews = this.state.secundaryImagePreviews.filter((_, i) => {
            if (i === index) {
                URL.revokeObjectURL(this.state.secundaryImagePreviews[i]);
                return false;
            }
            return true;
        });

        this.setState({
            secundaryImages: newImages,
            secundaryImagePreviews: newPreviews
        });
    }

    handleStatusChange(status) {
        const productId = this.props.params?.productId;
        const currentStatus = this.state.form.status;

        if (status === 'INACTIVE' && !productId) {
            return;
        }

        if (status === 'INACTIVE' && currentStatus !== 'INACTIVE') {
            this.setState({ pendingDeleteFromStatus: currentStatus || 'ACTIVE' });
        }
        this.handleChange({ target: { name: 'status', value: status } });
    }

    cancelDelete() {
        const previous = this.state.pendingDeleteFromStatus;
        this.setState({ pendingDeleteFromStatus: null });
        this.handleChange({ target: { name: 'status', value: previous } });
    }

    confirmDelete() {
        const productId = this.props.params?.productId;
        const previous = this.state.pendingDeleteFromStatus;
        this.setState({ isSaving: true, pendingDeleteFromStatus: null });
        this.props.productMutations.deleteProduct.mutateAsync(productId)
            .then(() => {
                this.setState({ isSaving: false });
                this.props.navigate("/shop");
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    translationService.t("product_delete_error");
                this.setState((prev) => ({
                    error: errorMessage,
                    isSaving: false,
                    form: { ...prev.form, status: previous || prev.form.status },
                }), this.focusErrorAlert);
            });
    }

    // ── Flat field handler ──────────────────────────────────────────────────
    handleChange(event) {
        const { name, value, type, checked } = event.target;
        this.props.formMethods.setValue(name, type === "checkbox" ? checked : value, {
            shouldDirty: true,
            shouldValidate: this.props.formMethods.formState.isSubmitted,
        });
        this.setState((prev) => ({
            form: updateFlatField(prev.form, event.target),
        }));
    }

    // ── Category handlers ───────────────────────────────────────────────────
    handleCategoryChange(index, field, value) {
        this.setState((prev) => {
            return { form: updateCategoryField(prev.form, index, field, value) };
        });
    }

    handleCategoryIdChange(index, value) {
        this.setState((prev) => {
            const form = updateCategoryById(prev.form, index, value, prev.availableCategories);
            this.props.formMethods.setValue("categories", form.categories, { shouldDirty: true });
            return { form };
        });
    }

    handleCategoryNameChange(index, value) {
        this.setState((prev) => {
            const form = updateCategoryByName(prev.form, index, value, prev.availableCategories);
            this.props.formMethods.setValue("categories", form.categories, { shouldDirty: true });
            return { form };
        });
    }

    addCategory() {
        this.setState((prev) => {
            const form = appendCategory(prev.form);
            this.props.formMethods.setValue("categories", form.categories, { shouldDirty: true });
            return { form };
        });
    }

    removeCategory(index) {
        this.setState((prev) => {
            const form = removeCategoryAt(prev.form, index);
            this.props.formMethods.setValue("categories", form.categories, { shouldDirty: true });
            return { form };
        });
    }

    // ── Comment handlers ────────────────────────────────────────────────────
    handleCommentChange(index, field, value) {
        this.setState((prev) => {
            return { form: updateCommentField(prev.form, index, field, value) };
        });
    }

    addComment() {
        this.setState((prev) => ({
            form: appendComment(prev.form),
        }));
    }

    removeComment(index) {
        this.setState((prev) => ({
            form: removeCommentAt(prev.form, index),
        }));
    }

    // ── Payload ─────────────────────────────────────────────────────────────
    async submitProduct(form) {

        const { principalImage, secundaryImages } = this.state;
        if (secundaryImages.length > 5) {
            const t = (key) => translationService.t(key);
            this.setState({ error: t("cannot_add_more_secondary_img") }, this.focusErrorAlert);
            return;
        }

        this.setState({ error: "", isSaving: true });

        const productId = this.props.params?.productId;
        try {
            const payload = buildProductPayload(form);
            const product = productId
                ? await this.props.productMutations.updateProduct.mutateAsync({ id: productId, product: payload })
                : await this.props.productMutations.createProduct.mutateAsync(payload);
                const finalProductId = product.id || product.product_id || productId;
                
                if (principalImage || (secundaryImages && secundaryImages.length > 0)) {
                    await this.props.productMutations.uploadProductImages.mutateAsync({
                        id: finalProductId,
                        principal: principalImage,
                        secondary: secundaryImages,
                    });
                }
            if (this.state.principalImagePreview) {
                URL.revokeObjectURL(this.state.principalImagePreview);
            }
            this.state.secundaryImagePreviews.forEach((url) => URL.revokeObjectURL(url));
            const emptyForm = createInitialForm();
            this.props.formMethods.reset(emptyForm);
            this.setState({
                form: emptyForm,
                principalImage: null,
                secundaryImages: [],
                principalImagePreview: "",
                secundaryImagePreviews: [],
                isSaving: false,
            });
            this.props.navigate(finalProductId ? `/product/${finalProductId}` : "/shop");
        } catch (err) {
            const defaultErrorMessage = productId
                ? translationService.t("product_update_error")
                : translationService.t("product_creation_error");
            const errorMessage = err.response?.data?.message || err.message || defaultErrorMessage;
            this.setState({ error: errorMessage, isSaving: false }, this.focusErrorAlert);
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    render() {
        const { form, error, isSaving, availableCategories, categoriesError } = this.state;
        const t = (key) => translationService.t(key);
        const productId = this.props.params?.productId;
        const isEditMode = !!productId;

        return (
            <main className="hu-mx-auto hu-w-full hu-max-w-6xl hu-px-4 hu-py-8 sm:hu-px-6 lg:hu-px-8">
                        <section className="hu-rounded-2xl hu-border hu-border-slate-200 hu-bg-white hu-p-5 hu-shadow-sm sm:hu-p-8">
                            <h1 className="hu-mb-2 hu-text-2xl hu-font-bold">{isEditMode ? t('edit_product_title') : t('create_product_title')}</h1>
                            <p className="hu-mb-6 hu-text-sm hu-text-slate-600">{isEditMode ? t('edit_product_subtitle') : t('create_product_subtitle')}</p>

                            {error && (
                                <div
                                    ref={this.errorAlertRef}
                                    className="hu-mb-5 hu-rounded-lg hu-border hu-border-red-200 hu-bg-red-50 hu-p-3 hu-text-sm hu-text-red-800"
                                    role="alert"
                                    tabIndex="-1"
                                >
                                    {error}
                                </div>
                            )}

                            <form
                                onSubmit={this.props.formMethods.handleSubmit(
                                    (values) => this.submitProduct(values),
                                    (errors) => {
                                        const firstError = Object.values(errors)[0];
                                        const message = firstError?.message || translationService.t("product_validation_error");
                                        this.setState({ error: String(message) }, this.focusErrorAlert);
                                    },
                                )}
                                noValidate
                            >

                                {/* ── Basic Info ── */}
                                <h2 className="hu-mb-3 hu-mt-6 hu-border-b hu-border-slate-200 hu-pb-2 hu-text-lg hu-font-semibold">{t('basic_info_title')}</h2>
                                <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2">
                                    <div className="hu-grid hu-gap-1.5">
                                        <label className="hu-text-sm hu-font-medium hu-text-slate-700" htmlFor="name">{t('name_label')}</label>
                                        <input
                                            id="name" name="name" type="text"
                                            className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm"
                                            value={form.name}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="hu-mt-4 hu-grid hu-gap-1.5">
                                    <label className="hu-text-sm hu-font-medium hu-text-slate-700" htmlFor="description">{t('description_label')}</label>
                                    <textarea
                                        id="description" name="description"
                                        className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm" rows="4"
                                        value={form.description}
                                        onChange={this.handleChange}
                                    />
                                </div>

                                <div className="hu-mt-4">
                                    <label className="hu-mb-2 hu-block hu-text-sm hu-font-medium hu-text-slate-700" id="status-label">{t('status_label')}</label>
                                    <div className="hu-inline-flex hu-rounded-lg hu-border hu-border-slate-300 hu-bg-slate-100 hu-p-1" role="group" aria-labelledby="status-label">
                                                <button
                                                    type="button"
                                                    aria-pressed={form.status === 'ACTIVE'}
                                                    className={`hu-cursor-pointer hu-rounded-md hu-border-0 hu-px-4 hu-py-2 hu-text-sm hu-font-semibold ${form.status === 'ACTIVE' ? 'hu-bg-green-700 hu-text-white' : 'hu-bg-transparent hu-text-slate-600 hover:hu-text-slate-900'}`}
                                                    onClick={() => this.handleStatusChange('ACTIVE')}
                                                >
                                                    {t('status_active')}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={form.status === 'DRAFT'}
                                                    className={`hu-cursor-pointer hu-rounded-md hu-border-0 hu-px-4 hu-py-2 hu-text-sm hu-font-semibold ${form.status === 'DRAFT' ? 'hu-bg-amber-400 hu-text-slate-900' : 'hu-bg-transparent hu-text-slate-600 hover:hu-text-slate-900'}`}
                                                    onClick={() => this.handleStatusChange('DRAFT')}
                                                >
                                                    {t('status_draft')}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={form.status === 'INACTIVE'}
                                                    className={`hu-cursor-pointer hu-rounded-md hu-border-0 hu-px-4 hu-py-2 hu-text-sm hu-font-semibold disabled:hu-cursor-not-allowed disabled:hu-opacity-50 ${form.status === 'INACTIVE' ? 'hu-bg-red-700 hu-text-white' : 'hu-bg-transparent hu-text-slate-600 hover:hu-text-slate-900'}`}
                                                    onClick={() => this.handleStatusChange('INACTIVE')}
                                                    disabled={!isEditMode}
                                                >
                                                    {t('status_inactive')}
                                                </button>
                                    </div>
                                </div>
                                
                                {/* ── Price ── */}
                                <h2 className="hu-mb-3 hu-mt-8 hu-border-b hu-border-slate-200 hu-pb-2 hu-text-lg hu-font-semibold">{t('price_title')}</h2>
                                <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2">
                                    <div className="hu-grid hu-gap-1.5">
                                        <label className="hu-text-sm hu-font-medium hu-text-slate-700" htmlFor="price_current">{t('current_price_label')}</label>
                                        <input
                                            id="price_current" name="price_current"
                                            type="number" min="0" step="0.01"
                                            className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm"
                                            value={form.price_current}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="hu-grid hu-gap-1.5">
                                        <label className="hu-text-sm hu-font-medium hu-text-slate-700" htmlFor="price_discount_percentage">{t('discount_percentage_label')}</label>
                                        <input
                                            id="price_discount_percentage" name="price_discount_percentage"
                                            type="number" min="0" max="100" step="0.01"
                                            className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm"
                                            value={form.price_discount_percentage}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                {/* ── Images ── */}
                                <h2 className="hu-mb-3 hu-mt-8 hu-border-b hu-border-slate-200 hu-pb-2 hu-text-lg hu-font-semibold">{t('images_title')}</h2>
                                <div className="hu-grid hu-gap-6 md:hu-grid-cols-2">
                                    {/* Principal Image */}
                                    <div className="hu-grid hu-content-start hu-gap-2 md:hu-border-r md:hu-border-slate-200 md:hu-pr-6">
                                        <label htmlFor="principal-img-input" className="hu-text-sm hu-font-semibold hu-text-slate-800">{t('main_image_label')}</label>
                                        <p className="hu-m-0 hu-text-xs hu-text-slate-500">{t('main_image_help')}</p>
                                        {!this.state.principalImagePreview ? (
                                            <div className="hu-mt-2">
                                                <input
                                                    id="principal-img-input"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hu-block hu-w-full hu-cursor-pointer hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-text-sm file:hu-mr-4 file:hu-border-0 file:hu-bg-slate-100 file:hu-px-4 file:hu-py-2"
                                                    onChange={this.handlePrincipalImageChange}
                                                />
                                            </div>
                                        ) : (
                                            <div className="hu-mt-2 hu-flex hu-items-center hu-gap-3 hu-rounded-lg hu-border hu-border-slate-200 hu-bg-white hu-p-2">
                                                <img
                                                    src={this.state.principalImagePreview}
                                                    alt={t('image_preview')}
                                                    className="hu-h-20 hu-w-20 hu-rounded-lg hu-object-cover"
                                                />
                                                <div className="hu-min-w-0 hu-flex-1 hu-overflow-hidden">
                                                    <span className="hu-block hu-truncate hu-text-sm hu-font-semibold">{this.state.principalImage.name}</span>
                                                    <span className="hu-text-xs hu-text-slate-500">{(this.state.principalImage.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="hu-rounded-md hu-border hu-border-red-600 hu-bg-white hu-px-3 hu-py-1.5 hu-text-xs hu-font-semibold hu-text-red-700 hover:hu-bg-red-50"
                                                    onClick={this.removePrincipalImage}
                                                >
                                                    {t('remove_img_btn')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Secondary Images */}
                                    <div className="hu-grid hu-content-start hu-gap-2">
                                        <label htmlFor="secundary-img-input" className="hu-text-sm hu-font-semibold hu-text-slate-800">
                                            {t('secondary_images_label')} ({this.state.secundaryImages.length}/5)
                                        </label>
                                        <p className="hu-m-0 hu-text-xs hu-text-slate-500">{t('secondary_images_help')}</p>
                                        {this.state.secundaryImages.length < 5 && (
                                            <div className="hu-mt-2">
                                                <input
                                                    id="secundary-img-input"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hu-block hu-w-full hu-cursor-pointer hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-text-sm file:hu-mr-4 file:hu-border-0 file:hu-bg-slate-100 file:hu-px-4 file:hu-py-2"
                                                    onChange={this.handleSecundaryImagesChange}
                                                />
                                            </div>
                                        )}
                                        <div className="hu-grid hu-gap-2">
                                            {this.state.secundaryImages.map((img, idx) => (
                                                <div key={idx} className="hu-flex hu-items-center hu-gap-3 hu-rounded-lg hu-border hu-border-slate-200 hu-bg-white hu-p-2">
                                                    <img
                                                        src={this.state.secundaryImagePreviews[idx]}
                                                        alt={`${t('secondary_image_preview')} ${idx + 1}`}
                                                        className="hu-h-16 hu-w-16 hu-rounded-lg hu-object-cover"
                                                    />
                                                    <div className="hu-min-w-0 hu-flex-1 hu-overflow-hidden">
                                                        <span className="hu-block hu-truncate hu-text-sm hu-font-semibold">{img.name}</span>
                                                        <span className="hu-text-xs hu-text-slate-500">{(img.size / 1024).toFixed(1)} KB</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="hu-rounded-md hu-border hu-border-red-600 hu-bg-white hu-px-3 hu-py-1.5 hu-text-xs hu-font-semibold hu-text-red-700 hover:hu-bg-red-50"
                                                        onClick={() => this.removeSecundaryImage(idx)}
                                                    >
                                                        {t('remove_img_btn')}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Categories ── */}
                                <h2 className="hu-mb-2 hu-mt-8 hu-border-b hu-border-slate-200 hu-pb-2 hu-text-lg hu-font-semibold">{t('categories_title')}</h2>
                                <small className="hu-mb-3 hu-block hu-text-xs hu-text-slate-500">
                                    {t('categories_subtitle')}
                                </small>
                                {categoriesError && (
                                    <div className="hu-mb-4 hu-rounded-lg hu-border hu-border-amber-200 hu-bg-amber-50 hu-p-3 hu-text-sm hu-text-amber-900" role="alert">
                                        {categoriesError}
                                    </div>
                                )}
                                <datalist id="available-category-ids">
                                    {availableCategories.map((category) => (
                                        <option
                                            key={category.category_id}
                                            value={category.category_id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </datalist>
                                <datalist id="available-category-names">
                                    {availableCategories.map((category) => (
                                        <option
                                            key={`name-${category.category_id}`}
                                            value={category.name}
                                        >
                                            {category.category_id}
                                        </option>
                                    ))}
                                </datalist>
                                {form.categories.map((cat, idx) => (
                                    <CategoryRow
                                        key={idx}
                                        category={cat}
                                        index={idx}
                                        availableCategories={availableCategories}
                                        t={t}
                                        onNameChange={(value) => this.handleCategoryNameChange(idx, value)}
                                        onIdChange={(value) => this.handleCategoryIdChange(idx, value)}
                                        onRemove={() => this.removeCategory(idx)}
                                        canRemove={form.categories.length > 1}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="hu-mt-2 hu-cursor-pointer hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2 hu-text-sm hu-font-semibold hu-text-slate-700 hover:hu-bg-slate-50"
                                    onClick={() => this.addCategory()}
                                >
                                    {t('add_category_btn')}
                                </button>

                                {/* ── Submit ── */}
                                <div className="hu-mt-6">
                                    <button
                                        type="submit"
                                        className="hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-green-700 hu-px-5 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-white hover:hu-bg-green-800 disabled:hu-cursor-not-allowed disabled:hu-bg-green-300"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? t('saving_btn') : (isEditMode ? t('update_product_btn') : t('create_product_btn'))}
                                    </button>
                                </div>
                            </form>
                        </section>
                {this.state.pendingDeleteFromStatus && (
                    <div className="hu-fixed hu-inset-0 hu-z-50 hu-grid hu-place-items-center hu-bg-slate-950/60 hu-p-4" role="dialog" aria-modal="true">
                        <div className="hu-w-full hu-max-w-md hu-rounded-2xl hu-bg-white hu-p-6 hu-text-center hu-shadow-2xl">
                            <p className="hu-m-0 hu-text-slate-800">
                                {t('confirm_delete_product')} <strong>{form.name}</strong>?
                            </p>
                            <div className="hu-mt-5 hu-flex hu-justify-center hu-gap-3">
                                <button type="button" className="hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-red-700 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-white hover:hu-bg-red-800" onClick={this.confirmDelete}>
                                    {t('accept')}
                                </button>
                                <button type="button" className="hu-cursor-pointer hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-slate-700 hover:hu-bg-slate-50" onClick={this.cancelDelete}>
                                    {t('cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        );
    }
}

function CreateProduct(props) {
    const productId = String(props.params?.productId ?? '');
    const categoriesQuery = useCategories();
    const productQuery = useProduct(productId);
    const productMutations = useProductMutations();
    const formMethods = useForm({
        resolver: zodResolver(createProductSchema(categoriesQuery.data || [])),
        defaultValues: createInitialForm(),
    });
    return (
        <CreateProductView
            {...props}
            categoriesQuery={categoriesQuery}
            productQuery={productQuery}
            productMutations={productMutations}
            formMethods={formMethods}
        />
    );
}

export default CreateProduct;