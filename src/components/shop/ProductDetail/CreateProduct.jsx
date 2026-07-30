import React, { Component } from "react";
import productosService from "../../../services/ProductosService.js";

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
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
                    || "The product could not be created.";

                this.setState({ error: errorMessage, isSaving: false });
            });
    }

    validateForm() {
        const { name, description, price, originalPrice } = this.state.form;

        if (!name.trim()) {
            return "Product name is required.";
        }

        if (!description.trim()) {
            return "Product description is required.";
        }

        if (Number(price) <= 0) {
            return "Current price must be greater than zero.";
        }

        if (originalPrice && Number(originalPrice) < Number(price)) {
            return "Original price must be greater than or equal to the current price.";
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

        return (
            <div className="container-fluid pt-5">
                <div className="row px-xl-5 justify-content-center">
                    <div className="col-lg-8">
                        <div className="bg-light p-30 mb-5">
                            <h2 className="mb-4">Create Product</h2>
                            <p className="mb-4">Add a new product and publish it to the catalog.</p>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={this.handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="name">Name</label>
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
                                        <label htmlFor="sku">SKU</label>
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
                                    <label htmlFor="description">Description</label>
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
                                        <label htmlFor="slug">Slug</label>
                                        <input
                                            id="slug"
                                            name="slug"
                                            type="text"
                                            className="form-control"
                                            value={form.slug}
                                            onChange={this.handleChange}
                                            placeholder="Generated from the name if left empty"
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="status">Status</label>
                                        <select
                                            id="status"
                                            name="status"
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

                                <div className="form-row">
                                    <div className="form-group col-md-4">
                                        <label htmlFor="price">Current Price</label>
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
                                        <label htmlFor="originalPrice">Original Price</label>
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
                                        <label htmlFor="currency">Currency</label>
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
                                        Tax inclusive price
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-primary px-4" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Create Product"}
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