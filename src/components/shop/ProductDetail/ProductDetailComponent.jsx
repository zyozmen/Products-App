import React, { Component } from "react";
import ProductDetails from "./ProductDetails";
import HeaderComponent from "../../dashboard/HeaderComponent";
import NavBarComponent from "../../dashboard/NavBarComponent";
import FooterComponent from "../../dashboard/FooterComponent";
import navigationComponent from "../../navigation/NavigationComponent";

class ProductDetailComponent extends Component {

    render() {
        const productId = Number(this.props.params?.id);
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        return (
            <>
            <HeaderComponentWithNavigation />
            <NavBarComponent />
            <ProductDetails params={{ id: productId }} />
            <FooterComponent />
            </>
        );
    }
}
export default ProductDetailComponent;