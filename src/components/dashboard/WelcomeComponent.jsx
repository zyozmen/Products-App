import React, { Component } from 'react';
import HeaderComponent from './HeaderComponent.jsx';
import FooterComponent from './FooterComponent.jsx';
import NavBarComponent from './NavBarComponent.jsx';
import CategoryComponent from './CategoryComponent.jsx';
import CarrouselComponent from './CarrouselComponent.jsx';
import FeaturedProducts from './FeaturedProducts.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';

class WelcomeComponent extends Component {

  render() {
     const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
    return (
      <>
        <HeaderComponentWithNavigation />
        <NavBarComponent />
        <CarrouselComponent />
        <FeaturedProducts />
        <CategoryComponent />
        <FooterComponent />
      </>
    );
  }
}

export default WelcomeComponent;