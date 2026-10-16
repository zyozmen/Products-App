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
import UserAdminComponent from './admin/UserAdminComponent.jsx';
import ProfileComponent from './profile/ProfileComponent.jsx';
import OrdersKanbanComponent from './admin/OrdersKanbanComponent.jsx';
import OrdersReportComponent from './admin/OrdersReportComponent.jsx';
import MyOrdersComponent from './orders/MyOrdersComponent.jsx';
import AgeVerificationModal from './ui/AgeVerificationModal.jsx';
import AuthenticationService from '../services/AuthenticationService.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';

const ADMIN_ROLES = ['admin'];

const AgeVerificationRouteWrapper = navigationComponent(class extends Component {
    render() {
        const { location } = this.props;
        const path = location.pathname;
        const allowedPaths = ['/', '/welcome', '/cart', '/shop'];
        const isAllowedPath = allowedPaths.includes(path);
        const isUserLoggedIn = AuthenticationService.isUserLoggedIn();

        if (!isUserLoggedIn && isAllowedPath) {
            return <AgeVerificationModal navigate={this.props.navigate} />;
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
        const OrdersKanbanComponentWithNavigation = navigationComponent(OrdersKanbanComponent);
        const OrdersReportComponentWithNavigation = navigationComponent(OrdersReportComponent);
        const MyOrdersComponentWithNavigation = navigationComponent(MyOrdersComponent);
        return (
            <div className="App">
                <BrowserRouter>
                    <AuthProvider>
                    <AgeVerificationRouteWrapper />
                    <Routes>
                        <Route path="/login" element={<LoginComponentWithNavigation />} />
                        <Route path="/" element={<WelcomeComponent />} />
                        <Route path="/welcome" element={<WelcomeComponent />} />
                        <Route path="/shop" element={<ShopComponentWithNavigation />} />
                        <Route path="/cart" element={<ShoppingCarComponentWithNavigation />} />
                        
                        <Route path="/welcome/:name" element={<ProtectedRoute><WelcomeComponentWithParams /></ProtectedRoute>} />
                        <Route path="/product/:id" element={<ProtectedRoute><ProductDetailComponentWithParams /></ProtectedRoute>} />
                        <Route path="/createProduct" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateProductComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/editProduct/:productId" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateProductComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><UserAdminComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><OrdersKanbanComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/admin/orders/report" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><OrdersReportComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><MyOrdersComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfileComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="*" element={<ErrorComponent />} />
                    </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </div>
        );
    }
}


export default GrowShopApp;