
import React, { Component } from "react";
import productosService from "../../services/ProductosService";

class CategoryFilter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            categories: [],
            loading: true,
            error: null,
        };

        this.handleAllCategoriesChange = this.handleAllCategoriesChange.bind(this);
        this.handleCategoryToggle = this.handleCategoryToggle.bind(this);
    }

    componentDidMount() {
        productosService.listarCategorias()
            .then((categories) => {
                this.setState({ categories, loading: false, error: null });
            })
            .catch(() => {
                this.setState({ categories: [], loading: false, error: "Could not load categories." });
            });
    }

    handleAllCategoriesChange() {
        const { onCategorySelectionChange } = this.props;
        if (onCategorySelectionChange) {
            onCategorySelectionChange([]);
        }
    }

    handleCategoryToggle(categoryId) {
        const { selectedCategoryIds = [], onCategorySelectionChange } = this.props;
        const normalizedId = String(categoryId);
        const isSelected = selectedCategoryIds.includes(normalizedId);
        const nextSelection = isSelected
            ? selectedCategoryIds.filter((id) => id !== normalizedId)
            : [...selectedCategoryIds, normalizedId];

        if (onCategorySelectionChange) {
            onCategorySelectionChange(nextSelection);
        }
    }

    render() {
        const { categories, loading, error } = this.state;
        const { selectedCategoryIds = [] } = this.props;
        const totalProductsInCategories = categories.reduce(
            (total, category) => total + Number(category.products_count ?? 0),
            0
        );

        return (

            <div className="bg-light p-4 mb-30">
                <form>
                    <div className="custom-control custom-checkbox d-flex align-items-center justify-content-between mb-3">
                        <input
                            type="checkbox"
                            className="custom-control-input"
                            checked={selectedCategoryIds.length === 0}
                            onChange={this.handleAllCategoriesChange}
                            id="category-all"
                        />
                        <label className="custom-control-label" htmlFor="category-all">
                            All Categories
                        </label>
                        <span className="badge border font-weight-normal">{totalProductsInCategories}</span>
                    </div>
                    {loading && <div className="text-muted">Loading categories...</div>}
                    {error && <div className="text-danger">{error}</div>}
                    {!loading && !error && categories.map((category) => (
                        <div
                            key={category.category_id}
                            className="custom-control custom-checkbox d-flex align-items-center justify-content-between mb-3"
                        >
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                checked={selectedCategoryIds.includes(String(category.category_id))}
                                onChange={() => this.handleCategoryToggle(category.category_id)}
                                id={`category-${category.category_id}`}
                            />
                            <label className="custom-control-label" htmlFor={`category-${category.category_id}`}>
                                {category.name}
                            </label>
                            <span className="badge border font-weight-normal">{category.products_count}</span>
                        </div>
                    ))}
                </form>
            </div>
        );
    }
}

export default CategoryFilter;