import React, { Component } from "react";
import CreateProduct from "./CreateProduct";
import HeaderComponent from "../../dashboard/HeaderComponent";
import FooterComponent from "../../dashboard/FooterComponent";
import navigationComponent from "../../navigation/NavigationComponent";

class CreateProductComponent extends Component {

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        return (
            <>
            <HeaderComponentWithNavigation />
            <CreateProduct navigate={this.props.navigate} />
            <FooterComponent />
            </>
        );
    }
}
export default CreateProductComponent;