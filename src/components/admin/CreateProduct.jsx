import React, { Component } from "react";
import productosService from "../../services/ProductosService.js";
import CategoryRow from "./CategoryRow.jsx";
import {
    appendCategory,
    appendComment,
    buildProductPayload,
    createInitialForm,
    removeCategoryAt,
    removeCommentAt,
    updateCategoryById,
    updateCategoryByName,
    updateCategoryField,
    updateCommentField,
    updateFlatField,
    validateProductForm,
} from "./CreateProductHelper.js";

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
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.focusErrorAlert = this.focusErrorAlert.bind(this);
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
                    categoriesError: "Categories could not be loaded. You can still type the category id manually.",
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
        this.setState((prev) => {
            return {
                form: updateCategoryById(prev.form, index, value, prev.availableCategories),
            };
        });
    }

    handleCategoryNameChange(index, value) {
        this.setState((prev) => {
            return {
                form: updateCategoryByName(prev.form, index, value, prev.availableCategories),
            };
        });
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

        this.setState({ error: "", isSaving: true });

        productosService
            .crearProducto(this.buildPayload())
            .then((product) => {
                const productId = product.id || product.product_id;
                this.setState({ form: createInitialForm(), isSaving: false });
                if (productId) {
                    this.props.navigate(`/product/${productId}`);
                    return;
                }
                this.props.navigate("/shop");
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    "The product could not be created.";
                this.setState({ error: errorMessage, isSaving: false }, this.focusErrorAlert);
            });
    }

    // ── Render ───────────────────────────────────────────────────────────────
    render() {
        const { form, error, isSaving, availableCategories, categoriesError } = this.state;

        return (
            <div className="container-fluid pt-5">
                <div className="row px-xl-5 justify-content-center">
                    <div className="col-lg-10">
                        <div className="bg-light p-30 mb-5">
                            <h2 className="mb-2">Create Product</h2>
                            <p className="mb-4">Add a new product and publish it to the catalog.</p>

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
                                <h5 className="mt-2 mb-3 border-bottom pb-2">Basic Information</h5>
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="name">Name *</label>
                                        <input
                                            id="name" name="name" type="text"
                                            className="form-control"
                                            value={form.name}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="sku">SKU</label>
                                        <input
                                            id="sku" name="sku" type="text"
                                            className="form-control"
                                            value={form.sku}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description *</label>
                                    <textarea
                                        id="description" name="description"
                                        className="form-control" rows="4"
                                        value={form.description}
                                        onChange={this.handleChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="slug">Slug</label>
                                        <input
                                            id="slug" name="slug" type="text"
                                            className="form-control"
                                            value={form.slug}
                                            onChange={this.handleChange}
                                            placeholder="Generated from name if left empty"
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="status">Status</label>
                                        <select
                                            id="status" name="status"
                                            className="form-control"
                                            value={form.status}
                                            onChange={this.handleChange}
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="DRAFT">DRAFT</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* ── Price ── */}
                                <h5 className="mt-4 mb-3 border-bottom pb-2">Price</h5>
                                <div className="form-row">
                                    <div className="form-group col-md-3">
                                        <label htmlFor="price_current">Current Price *</label>
                                        <input
                                            id="price_current" name="price_current"
                                            type="number" min="0" step="0.01"
                                            className="form-control"
                                            value={form.price_current}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label htmlFor="price_currency">Currency</label>
                                        <input
                                            id="price_currency" name="price_currency"
                                            type="text" maxLength="3"
                                            className="form-control"
                                            value={form.price_currency}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label htmlFor="price_discount_percentage">Discount %</label>
                                        <input
                                            id="price_discount_percentage" name="price_discount_percentage"
                                            type="number" min="0" max="100" step="0.01"
                                            className="form-control"
                                            value={form.price_discount_percentage}
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group form-check">
                                    <input
                                        id="price_tax_inclusive" name="price_tax_inclusive"
                                        type="checkbox" className="form-check-input"
                                        checked={form.price_tax_inclusive}
                                        onChange={this.handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="price_tax_inclusive">
                                        Tax inclusive price
                                    </label>
                                </div>

                                {/* ── Categories ── */}
                                <h5 className="mt-4 mb-1 border-bottom pb-2">Categories *</h5>
                                <small className="text-muted d-block mb-2">
                                    Add or select at least one category before creating the product.
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
                                        onSlugChange={(value) => this.handleCategoryChange(idx, "slug", value)}
                                        onRemove={() => this.removeCategory(idx)}
                                        canRemove={form.categories.length > 1}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-sm mb-4"
                                    onClick={() => this.addCategory()}
                                >
                                    + Add Category
                                </button>

                                {/* ── Submit ── */}
                                <div className="mt-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-5"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Create Product"}
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