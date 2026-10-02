import React, { Component } from 'react';
import './GrowShop.css';
import LoginComponent from './login/LoginComponent.jsx';
import {BrowserRouter, Route, Routes, Navigate} from 'react-router-dom';
import navigationComponent from './navigation/NavigationComponent.jsx'  
import paramsComponent from './navigation/NavigationParamsComponent.jsx';
import ErrorComponent from './login/ErrorComponent.jsx';
import WelcomeComponent from './dashboard/WelcomeComponent.jsx';
import ShopComponent from './shop/ShopComponent.jsx';
import ProductDetailComponent from './shop/ProductDetail/ProductDetailComponent.jsx';
import CreateProductComponent from './admin/CreateProductComponent.jsx';
import ShoppingCarComponent from './cart/ShoppingCarComponent.jsx';
import UserAdminComponent from './admin/UserAdminComponent.jsx';
import ProfileComponent from './profile/ProfileComponent.jsx';
import AgeVerificationModal from './ui/AgeVerificationModal.jsx';
import AuthenticationService from '../services/AuthenticationService.js';

class RequireAuth extends Component {
    render() {
        if (!AuthenticationService.isUserLoggedIn()) {
            return <Navigate to="/login" replace />;
        }
        return this.props.children;
    }
}

const AgeVerificationRouteWrapper = navigationComponent(class extends Component {
    render() {
        const { location } = this.props;
        const path = location.pathname;
        const allowedPaths = ['/', '/welcome', '/cart', '/shop'];
        const isAllowedPath = allowedPaths.includes(path);
        const isUserLoggedIn = AuthenticationService.isUserLoggedIn();

        if (!isUserLoggedIn && isAllowedPath) {
            return <AgeVerificationModal />;
        }
        return null;
    }
});

class GrowShopApp extends Component {
    render() {
        const LoginComponentWithNavigation = navigationComponent(LoginComponent);
        const ShopComponentWithNavigation = navigationComponent(ShopComponent);
        const WelcomeComponentWithParams = paramsComponent(WelcomeComponent);
        const ProductDetailComponentWithParams = paramsComponent(ProductDetailComponent);
        const CreateProductComponentWithNavigation = navigationComponent(CreateProductComponent);
        const ShoppingCarComponentWithNavigation = navigationComponent(ShoppingCarComponent);
        const UserAdminComponentWithNavigation = navigationComponent(UserAdminComponent);
        const ProfileComponentWithNavigation = navigationComponent(ProfileComponent);
        return (
            <div className="App">
                <BrowserRouter>
                    <AgeVerificationRouteWrapper />
                    <Routes>
                        <Route path="/login" element={<LoginComponentWithNavigation />} />
                        <Route path="/" element={<WelcomeComponent />} />
                        <Route path="/welcome" element={<WelcomeComponent />} />
                        <Route path="/shop" element={<ShopComponentWithNavigation />} />
                        <Route path="/cart" element={<ShoppingCarComponentWithNavigation />} />
                        
                        <Route path="/welcome/:name" element={<RequireAuth><WelcomeComponentWithParams /></RequireAuth>} />
                        <Route path="/product/:id" element={<RequireAuth><ProductDetailComponentWithParams /></RequireAuth>} />
                        <Route path="/createProduct" element={<RequireAuth><CreateProductComponentWithNavigation /></RequireAuth>} />
                        <Route path="/editProduct/:productId" element={<RequireAuth><CreateProductComponentWithNavigation /></RequireAuth>} />
                        <Route path="/admin/users" element={<RequireAuth><UserAdminComponentWithNavigation /></RequireAuth>} />
                        <Route path="/profile" element={<RequireAuth><ProfileComponentWithNavigation /></RequireAuth>} />
                        <Route path="*" element={<ErrorComponent />} />
                    </Routes>
                </BrowserRouter>
            </div>
        );
    }
}


export default GrowShopApp;