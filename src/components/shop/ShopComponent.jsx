import React, { Component } from "react";
import HeaderComponent from "../dashboard/HeaderComponent";
import NavBarComponent from "../dashboard/NavBarComponent";
import FooterComponent from "../dashboard/FooterComponent";
import ShopListComponent from "./ShopListComponent";
import navigationComponent from "../navigation/NavigationComponent";

class ShopComponent extends Component {

  render() {
    const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
    const { location, navigate } = this.props;
    return (
      <>
            <HeaderComponentWithNavigation />
            <NavBarComponent />
            <ShopListComponent location={location} navigate={navigate} />
            <FooterComponent />
      </>
    );
  }
}

export default ShopComponent;