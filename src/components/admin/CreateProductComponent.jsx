import React, { Component } from "react";
import CreateProduct from "./CreateProduct";
import HeaderComponent from "../dashboard/HeaderComponent";
import NavBarComponent from "../dashboard/NavBarComponent";
import FooterComponent from "../dashboard/FooterComponent";

class CreateProductComponent extends Component {

    render() {
        return (
            <>
            <HeaderComponent />
            <NavBarComponent />
            <CreateProduct navigate={this.props.navigate} />
            <FooterComponent />
            </>
        );
    }
}
export default CreateProductComponent;