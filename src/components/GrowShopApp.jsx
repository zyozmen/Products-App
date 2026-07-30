import React, { Component } from 'react';
import './GrowShop.css';
import LoginComponent from './login/LoginComponent.jsx';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import navigationComponent from './navigation/NavigationComponent.jsx'  
import paramsComponent from './navigation/NavigationParamsComponent.jsx';
import ErrorComponent from './login/ErrorComponent.jsx';
import WelcomeComponent from './dashboard/WelcomeComponent.jsx';
import ShopComponent from './shop/ShopComponent.jsx';
import ProductDetailComponent from './shop/ProductDetail/ProductDetailComponent.jsx';
import CreateProductComponent from './admin/CreateProductComponent.jsx';
import ShoppingCarComponent from './cart/ShoppingCarComponent.jsx';
import FavoritesComponent from './favorites/FavoritesComponent.jsx';

class GrowShopApp extends Component {
    render() {
        const LoginComponentWithNavigation = navigationComponent(LoginComponent);
        const ShopComponentWithNavigation = navigationComponent(ShopComponent);
        const WelcomeComponentWithParams = paramsComponent(WelcomeComponent);
        const ProductDetailComponentWithParams = paramsComponent(ProductDetailComponent);
        const CreateProductComponentWithNavigation = navigationComponent(CreateProductComponent);
        const ShoppingCarComponentWithNavigation = navigationComponent(ShoppingCarComponent);
        const FavoritesComponentWithNavigation = navigationComponent(FavoritesComponent);
        return (
            <div className="App">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<WelcomeComponent />} />
                        <Route path="/shop" element={<ShopComponentWithNavigation />} />
                        <Route path="/login" element={<LoginComponentWithNavigation />} />
                        <Route path="/welcome/:name" element={<WelcomeComponentWithParams />} />
                        <Route path="/product/:id" element={<ProductDetailComponentWithParams />} />
                        <Route path="/createProduct" element={<CreateProductComponentWithNavigation />} />
                        <Route path="/cart" element={<ShoppingCarComponentWithNavigation />} />
                        <Route path="/favorites" element={<FavoritesComponentWithNavigation />} />
                        <Route path="*" element={<ErrorComponent />} />
                    </Routes>
                </BrowserRouter>
            </div>
        );
    }
}


export default GrowShopApp;