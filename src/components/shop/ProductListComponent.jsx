import React, { Component } from "react";
import FilterProducts from "./FilterProducts";
import { NavLink } from "react-router-dom";
import productosService from "../../services/ProductosService";
import cartService from "../../services/CartService";

class ProductListComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            products: [],
            loading: true,
            error: null,
            searchTerm: "",
            pageNumber: 0,
            pageSize: 15,
            totalPages: 0,
            totalElements: 0,
            numberOfElements: 0,
            first: true,
            last: true,
        };

        this.loadProducts = this.loadProducts.bind(this);
        this.goToPreviousPage = this.goToPreviousPage.bind(this);
        this.goToNextPage = this.goToNextPage.bind(this);
        this.goToPage = this.goToPage.bind(this);
        this.getVisiblePageNumbers = this.getVisiblePageNumbers.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
        this.handleAddToCart = this.handleAddToCart.bind(this);
    }

    handleAddToCart(event, product) {
        event.preventDefault();
        cartService.addToCart({
            id: product.id,
            name: product.name,
            price: product.current_price,
            image: `/img/product-${product.id}.jpg`,
        });
    }

    componentDidMount() {
        this.loadProducts(0);
    }

    componentDidUpdate(prevProps) {
        const previousQuery = new URLSearchParams(prevProps.location?.search || "");
        const currentQuery = new URLSearchParams(this.props.location?.search || "");
        const previousSearch = previousQuery.get("name") || previousQuery.get("search") || "";
        const currentSearch = currentQuery.get("name") || currentQuery.get("search") || "";
        const previousCategoryKey = (prevProps.selectedCategoryIds || []).join(",");
        const currentCategoryKey = (this.props.selectedCategoryIds || []).join(",");
        const previousFiltersKey = JSON.stringify(prevProps.filters || {});
        const currentFiltersKey = JSON.stringify(this.props.filters || {});

        if (previousSearch !== currentSearch || previousCategoryKey !== currentCategoryKey || previousFiltersKey !== currentFiltersKey) {
            this.loadProducts(0, undefined, currentSearch);
        }
    }

    loadProducts(pageNumber, selectedPageSize, forcedSearchTerm) {
        const { pageSize, searchTerm } = this.state;
        const { filters = {} } = this.props;
        const selectedCategoryIds = this.props.selectedCategoryIds || [];
        const effectivePageSize = selectedPageSize || pageSize;
        const queryParams = new URLSearchParams(this.props.location?.search || "");
        const querySearch = queryParams.get("name") || queryParams.get("search") || "";
        const effectiveSearchTerm = forcedSearchTerm !== undefined ? forcedSearchTerm : querySearch || searchTerm;
        this.setState({ loading: true, error: null });
        productosService.listarProductos(pageNumber, effectivePageSize, {
            searchTerm: effectiveSearchTerm,
            categoryIds: selectedCategoryIds,
            sortBy: filters.sortBy,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            minRating: filters.minRating,
            maxRating: filters.maxRating,
        })
            .then(({ products, pagination }) => {
                this.setState({
                    products,
                    loading: false,
                    error: null,
                    searchTerm: effectiveSearchTerm,
                    pageNumber: pagination.pageNumber,
                    pageSize: pagination.pageSize,
                    totalPages: pagination.totalPages,
                    totalElements: pagination.totalElements,
                    numberOfElements: pagination.numberOfElements,
                    first: pagination.first,
                    last: pagination.last,
                });
            })
            .catch(() => {
                this.setState({ products: [], loading: false, error: "Could not load products." });
            });
    }

    goToPreviousPage() {
        const { pageNumber, first } = this.state;
        if (!first) {
            this.loadProducts(pageNumber - 1);
        }
    }

    goToNextPage() {
        const { pageNumber, last } = this.state;
        if (!last) {
            this.loadProducts(pageNumber + 1);
        }
    }

    goToPage(targetPage) {
        const { totalPages } = this.state;
        if (targetPage >= 0 && targetPage < totalPages) {
            this.loadProducts(targetPage);
        }
    }

    getVisiblePageNumbers() {
        const { pageNumber, totalPages } = this.state;
        const maxVisiblePages = 10;

        if (totalPages <= 0) {
            return [];
        }

        const halfWindow = Math.floor(maxVisiblePages / 2);
        let startPage = Math.max(0, pageNumber - halfWindow);
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        // Shift window left when near the end to keep 10 pages visible when possible.
        startPage = Math.max(0, endPage - maxVisiblePages + 1);

        const pages = [];
        for (let page = startPage; page <= endPage; page += 1) {
            pages.push(page);
        }

        return pages;
    }

    handlePageSizeChange(nextPageSize) {
        this.loadProducts(0, Number(nextPageSize));
    }

    renderStars(averageRating) {
        const stars = Math.max(0, Math.min(5, Math.round(Number(averageRating) || 0)));
        return [...Array(stars)].map((_, i) => (
            <small key={i} className="fa fa-star text-primary mr-1" />
        ));
    }

    renderPaginationControls(visiblePages) {
        const { pageNumber, totalPages, totalElements, numberOfElements, first, last } = this.state;

        return (
            <div className="col-12 mt-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                    {!first ? (
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={this.goToPreviousPage}
                        >
                            Previous
                        </button>
                    ) : <div />}

                    <ul className="pagination mb-0 mt-2 mt-md-0">
                        {visiblePages.map((page) => (
                            <li key={page} className={`page-item ${page === pageNumber ? "active" : ""}`}>
                                <button
                                    type="button"
                                    className="page-link"
                                    onClick={() => this.goToPage(page)}
                                >
                                    {page + 1}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {!last ? (
                        <button
                            type="button"
                            className="btn btn-light mt-2 mt-md-0"
                            onClick={this.goToNextPage}
                        >
                            Next
                        </button>
                    ) : <div />}
                </div>

                <div className="text-center mt-2">
                    Showing {numberOfElements} of {totalElements} | Page {totalPages === 0 ? 0 : pageNumber + 1} of {totalPages}
                </div>
            </div>
        );
    }

    render() {
        const { products, loading, error, pageNumber, pageSize, totalPages, totalElements, numberOfElements } = this.state;
        const { selectedSortBy, onSortByChange } = this.props;
        const visiblePages = this.getVisiblePageNumbers();

        return (

            <div className="col-lg-9 col-md-8">
                <div className="row pb-3">
                    <FilterProducts
                        selectedPageSize={pageSize}
                        pageSizeOptions={[15, 30, 45]}
                        onPageSizeChange={this.handlePageSizeChange}
                        selectedSortBy={selectedSortBy}
                        onSortByChange={onSortByChange}
                    />
                    {loading && <div className="col-12">Loading products...</div>}
                    {error && <div className="col-12 text-danger">{error}</div>}
                    {!loading && !error && products.length > 0 && this.renderPaginationControls(visiblePages)}
                    {!loading && !error && products.length === 0 && (
                        <div className="col-12 text-center py-4"><h1>Producto no encontrado</h1></div>
                    )}
                    {!loading && !error && products.map((product) => (
                    <div key={product.id} className="col-lg-4 col-md-6 col-sm-6 pb-1">
                        <div className="product-item bg-light mb-4">
                            <div className="product-img position-relative overflow-hidden">
                                <img className="img-fluid w-100" src="img/product-1.jpg" alt="" />
                                <div className="product-action">
                                    <button type="button" className="btn btn-outline-dark btn-square" onClick={(event) => this.handleAddToCart(event, product)} aria-label="Agregar al carrito">
                                        <i className="fa fa-shopping-cart" />
                                    </button>
                                    <button type="button" className="btn btn-outline-dark btn-square" aria-label="Agregar a favoritos">
                                        <i className="far fa-heart" />
                                    </button>
                                    <NavLink className="btn btn-outline-dark btn-square" to={`/product/${product.id}`}>
                                        <i className="fa fa-search" />
                                    </NavLink>
                                </div>
                            </div>
                            <div className="text-center py-4">
                                <NavLink className="h6 text-decoration-none text-truncate" to={`/product/${product.id}`}>
                                    {product.name}
                                </NavLink>
                                <div className="d-flex align-items-center justify-content-center mt-2">
                                    <h5>{product.price_currency} {product.current_price}</h5>
                                    <h6 className="text-muted ml-2">
                                        <del>{product.price_currency} {product.original_price}</del>
                                    </h6>
                                </div>
                                <div className="d-flex align-items-center justify-content-center mb-1">
                                    {this.renderStars(product.average_rating)}
                                    <small>({product.total_reviews})</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}

                    {!loading && !error && products.length > 0 && (
                        this.renderPaginationControls(visiblePages)
                    )}
                </div>
            </div>
        );
    }
}

export default ProductListComponent;