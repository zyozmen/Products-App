import React, { Component } from "react";
import productosService from "../../services/ProductosService.js";
import CategoryRow from "./CategoryRow.jsx";
import translationService from "../../services/TranslationService.js";
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
    validateProductForm,
} from "./CreateProductHelper.js";

// Note: Removed unused functions updateCategoryById and updateCategoryByName since availableCategories is used as state-driven data.
// In case you need them, they can be imported or re-implemented directly, but they are not strictly needed here.

class CreateProduct extends Component {
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
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
        this.loadCategories();
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });

        const productId = this.props.params?.productId;
        if (productId) {
            this.loadProduct(productId);
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

    loadProduct(productId) {
        this.setState({ isSaving: true });
        productosService
            .detalleProducto(productId)
            .then((product) => {
                this.setState({
                    form: formFromProduct(product),
                    isSaving: false,
                });
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    translationService.t("product_load_error");
                this.setState({
                    error: errorMessage,
                    isSaving: false,
                }, this.focusErrorAlert);
            });
    }

    loadCategories() {
        productosService
            .listarCategorias()
            .then((availableCategories) => {
                this.setState({ availableCategories, categoriesError: "" });
            })
            .catch(() => {
                this.setState({
                    availableCategories: [],
                    categoriesError: translationService.t("categories_load_error"),
                });
            });
    }

    // ── Flat field handler ──────────────────────────────────────────────────
    handleChange(event) {
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
        this.setState((prev) => ({
            form: updateCategoryById(prev.form, index, value, prev.availableCategories),
        }));
    }

    handleCategoryNameChange(index, value) {
        this.setState((prev) => ({
            form: updateCategoryByName(prev.form, index, value, prev.availableCategories),
        }));
    }

    addCategory() {
        this.setState((prev) => ({
            form: appendCategory(prev.form),
        }));
    }

    removeCategory(index) {
        this.setState((prev) => ({
            form: removeCategoryAt(prev.form, index),
        }));
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

    // ── Validation ──────────────────────────────────────────────────────────
    validateForm() {
        const { form, availableCategories } = this.state;
        return validateProductForm(form, availableCategories);
    }

    // ── Payload ─────────────────────────────────────────────────────────────
    buildPayload() {
        const { form } = this.state;
        return buildProductPayload(form);
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    handleSubmit(event) {
        event.preventDefault();

        const validationError = this.validateForm();
        if (validationError) {
            this.setState({ error: validationError }, this.focusErrorAlert);
            return;
        }

        const { principalImage, secundaryImages } = this.state;
        if (secundaryImages.length > 5) {
            const t = (key) => translationService.t(key);
            this.setState({ error: t("cannot_add_more_secondary_img") }, this.focusErrorAlert);
            return;
        }

        this.setState({ error: "", isSaving: true });

        const productId = this.props.params?.productId;
        const apiCall = productId
            ? productosService.actualizarProducto(productId, this.buildPayload())
            : productosService.crearProducto(this.buildPayload());

        apiCall
            .then((product) => {
                const finalProductId = product.id || product.product_id || productId;
                
                if (principalImage || (secundaryImages && secundaryImages.length > 0)) {
                    return productosService.subirImagenesProducto(finalProductId, principalImage, secundaryImages)
                        .then(() => finalProductId);
                }
                return finalProductId;
            })
            .then((finalProductId) => {
                if (this.state.principalImagePreview) {
                    URL.revokeObjectURL(this.state.principalImagePreview);
                }
                this.state.secundaryImagePreviews.forEach((url) => {
                    URL.revokeObjectURL(url);
                });

                this.setState({
                    form: createInitialForm(),
                    principalImage: null,
                    secundaryImages: [],
                    principalImagePreview: "",
                    secundaryImagePreviews: [],
                    isSaving: false
                });

                if (finalProductId) {
                    this.props.navigate(`/product/${finalProductId}`);
                    return;
                }
                this.props.navigate("/shop");
            })
            .catch((err) => {
                const defaultErrorMessage = productId
                    ? translationService.t("product_update_error")
                    : translationService.t("product_creation_error");
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    defaultErrorMessage;
                this.setState({ error: errorMessage, isSaving: false }, this.focusErrorAlert);
            });
    }

    // ── Render ───────────────────────────────────────────────────────────────
    render() {
        const { form, error, isSaving, availableCategories, categoriesError } = this.state;
        const t = (key) => translationService.t(key);
        const productId = this.props.params?.productId;
        const isEditMode = !!productId;

        return (
            <div className="container-fluid pt-5">
                <div className="row px-xl-5 justify-content-center">
                    <div className="col-lg-10">
                        <div className="bg-light p-30 mb-5">
                            <h2 className="mb-2">{isEditMode ? t('edit_product_title') : t('create_product_title')}</h2>
                            <p className="mb-4">{isEditMode ? t('edit_product_subtitle') : t('create_product_subtitle')}</p>

                            {error && (
                                <div
                                    ref={this.errorAlertRef}
                                    className="alert alert-danger"
                                    role="alert"
                                    tabIndex="-1"
                                >
                                    {error}
                                </div>
                            )}

                            <form onSubmit={this.handleSubmit}>

                                {/* ── Basic Info ── */}
                                <h5 className="mt-2 mb-3 border-bottom pb-2">{t('basic_info_title')}</h5>
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="name">{t('name_label')}</label>
                                        <input
                                            id="name" name="name" type="text"
                                            className="form-control"
                                            value={form.name}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">{t('description_label')}</label>
                                    <textarea
                                        id="description" name="description"
                                        className="form-control" rows="4"
                                        value={form.description}
                                        onChange={this.handleChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="status">{t('status_label')}</label>
                                        <div className="status-slider-container-box">
                                            <div className="status-slider-wrapper" data-status={form.status || 'ACTIVE'}>
                                                <div className="status-slider-indicator"></div>
                                                <button
                                                    type="button"
                                                    className="status-slider-btn btn-ACTIVE"
                                                    onClick={() => this.handleChange({ target: { name: 'status', value: 'ACTIVE' } })}
                                                >
                                                    {t('status_active')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="status-slider-btn btn-DRAFT"
                                                    onClick={() => this.handleChange({ target: { name: 'status', value: 'DRAFT' } })}
                                                >
                                                    {t('status_draft')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="status-slider-btn btn-INACTIVE"
                                                    onClick={() => this.handleChange({ target: { name: 'status', value: 'INACTIVE' } })}
                                                >
                                                    {t('status_inactive')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* ── Price ── */}
                                <h5 className="mt-4 mb-3 border-bottom pb-2">{t('price_title')}</h5>
                                <div className="form-row">
                                    <div className="form-group col-md-3">
                                        <label htmlFor="price_current">{t('current_price_label')}</label>
                                        <input
                                            id="price_current" name="price_current"
                                            type="number" min="0" step="0.01"
                                            className="form-control"
                                            value={form.price_current}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label htmlFor="price_discount_percentage">{t('discount_percentage_label')}</label>
                                        <input
                                            id="price_discount_percentage" name="price_discount_percentage"
                                            type="number" min="0" max="100" step="0.01"
                                            className="form-control"
                                            value={form.price_discount_percentage}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                {/* ── Images ── */}
                                <h5 className="mt-4 mb-3 border-bottom pb-2">{t('images_title')}</h5>
                                <div className="form-row">
                                    {/* Principal Image */}
                                    <div className="form-group col-md-6 border-right">
                                        <label htmlFor="principal-img-input" className="font-weight-bold">{t('main_image_label')}</label>
                                        <p className="small text-muted">{t('main_image_help')}</p>
                                        {!this.state.principalImagePreview ? (
                                            <div className="custom-file mb-2">
                                                <input
                                                    id="principal-img-input"
                                                    type="file"
                                                    accept="image/*"
                                                    className="custom-file-input"
                                                    onChange={this.handlePrincipalImageChange}
                                                />
                                                <label className="custom-file-label" htmlFor="principal-img-input">
                                                    {t('select_file_btn')}
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center mb-3 p-2 border rounded bg-white">
                                                <img
                                                    src={this.state.principalImagePreview}
                                                    alt="Principal Preview"
                                                    style={{ width: "80px", height: "80px", objectFit: "cover", marginRight: "15px" }}
                                                    className="rounded"
                                                />
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <span className="d-block text-truncate font-weight-semi-bold">{this.state.principalImage.name}</span>
                                                    <span className="small text-muted">{(this.state.principalImage.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={this.removePrincipalImage}
                                                >
                                                    {t('remove_img_btn')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Secondary Images */}
                                    <div className="form-group col-md-6">
                                        <label htmlFor="secundary-img-input" className="font-weight-bold">
                                            {t('secondary_images_label')} ({this.state.secundaryImages.length}/5)
                                        </label>
                                        <p className="small text-muted">{t('secondary_images_help')}</p>
                                        {this.state.secundaryImages.length < 5 && (
                                            <div className="custom-file mb-3">
                                                <input
                                                    id="secundary-img-input"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="custom-file-input"
                                                    onChange={this.handleSecundaryImagesChange}
                                                />
                                                <label className="custom-file-label" htmlFor="secundary-img-input">
                                                    {t('select_file_btn')}
                                                </label>
                                            </div>
                                        )}
                                        <div className="d-flex flex-column gap-2">
                                            {this.state.secundaryImages.map((img, idx) => (
                                                <div key={idx} className="d-flex align-items-center mb-2 p-2 border rounded bg-white">
                                                    <img
                                                        src={this.state.secundaryImagePreviews[idx]}
                                                        alt={`Secundary Preview ${idx + 1}`}
                                                        style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "15px" }}
                                                        className="rounded"
                                                    />
                                                    <div className="flex-grow-1 overflow-hidden">
                                                        <span className="d-block text-truncate font-weight-semi-bold">{img.name}</span>
                                                        <span className="small text-muted">{(img.size / 1024).toFixed(1)} KB</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
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
                                <h5 className="mt-4 mb-1 border-bottom pb-2">{t('categories_title')}</h5>
                                <small className="text-muted d-block mb-2">
                                    {t('categories_subtitle')}
                                </small>
                                {categoriesError && (
                                    <div className="alert alert-warning" role="alert">
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
                                        onNameChange={(value) => this.handleCategoryNameChange(idx, value)}
                                        onIdChange={(value) => this.handleCategoryIdChange(idx, value)}
                                        onRemove={() => this.removeCategory(idx)}
                                        canRemove={form.categories.length > 1}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-sm mb-4"
                                    onClick={() => this.addCategory()}
                                >
                                    {t('add_category_btn')}
                                </button>

                                {/* ── Submit ── */}
                                <div className="mt-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-5"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? t('saving_btn') : (isEditMode ? t('update_product_btn') : t('create_product_btn'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CreateProduct;