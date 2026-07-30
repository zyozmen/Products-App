
import React, { Component } from "react";
import FiltersComponent from "./FiltersComponent";
import ProductListComponent from "./ProductListComponent";  

class ShopListComponent extends Component {
  constructor(props) {
    super(props);
    const queryParams = new URLSearchParams(props.location?.search || "");
    const initialNameFilter = queryParams.get("name") || "";
    this.state = {
      selectedCategoryIds: [],
      sortBy: "",
      minPrice: null,
      maxPrice: null,
      minRating: null,
      maxRating: null,
      nameFilter: initialNameFilter,
    };

    this.handleCategorySelectionChange = this.handleCategorySelectionChange.bind(this);
    this.handleSortByChange = this.handleSortByChange.bind(this);
    this.handlePriceRangeChange = this.handlePriceRangeChange.bind(this);
    this.handleNameFilterChange = this.handleNameFilterChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    const previousQuery = new URLSearchParams(prevProps.location?.search || "");
    const currentQuery = new URLSearchParams(this.props.location?.search || "");
    const previousName = previousQuery.get("name") || "";
    const currentName = currentQuery.get("name") || "";

    if (previousName !== currentName && this.state.nameFilter !== currentName) {
      this.setState({ nameFilter: currentName });
    }
  }

  handleCategorySelectionChange(selectedCategoryIds) {
    this.setState({ selectedCategoryIds });
  }

  handleSortByChange(sortBy) {
    this.setState({ sortBy });
  }

  handlePriceRangeChange(range) {
    this.setState({
      minPrice: range?.minPrice ?? null,
      maxPrice: range?.maxPrice ?? null,
    });
  }

  handleNameFilterChange(nameFilter) {
    const normalizedName = String(nameFilter ?? "").trim();
    const queryParams = new URLSearchParams(this.props.location?.search || "");

    if (normalizedName) {
      queryParams.set("name", normalizedName);
    } else {
      queryParams.delete("name");
    }

    const queryString = queryParams.toString();
    this.props.navigate(queryString ? `/shop?${queryString}` : "/shop");
  }

  render() {
    const { location } = this.props;
    const { selectedCategoryIds, sortBy, minPrice, maxPrice, minRating, maxRating, nameFilter } = this.state;
    const filters = {
      sortBy,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
    };
    
    return (

<div className="container-fluid">
  <div className="row px-xl-5">
    <FiltersComponent
      selectedCategoryIds={selectedCategoryIds}
      onCategorySelectionChange={this.handleCategorySelectionChange}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPriceRangeChange={this.handlePriceRangeChange}
      nameFilter={nameFilter}
      onNameFilterChange={this.handleNameFilterChange}
    />
    <ProductListComponent
      location={location}
      selectedCategoryIds={selectedCategoryIds}
      filters={filters}
      onSortByChange={this.handleSortByChange}
      selectedSortBy={sortBy}
    />
  </div>
</div>
    );
  }
}

export default ShopListComponent;
