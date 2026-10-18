import React, { Suspense } from 'react';
import LoginComponent from './login/LoginComponent.jsx';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import navigationComponent from './navigation/NavigationComponent.jsx'  
import paramsComponent from './navigation/NavigationParamsComponent.jsx';
import ErrorComponent from './login/ErrorComponent.jsx';
import WelcomeComponent from './dashboard/WelcomeComponent.jsx';
import ShopComponent from './shop/ShopComponent.jsx';
import ProductDetailComponent from './shop/ProductDetail/ProductDetailComponent.jsx';
import CreateProductComponent from './admin/products/CreateProductComponent.jsx';
import ShoppingCarComponent from './cart/ShoppingCarComponent.jsx';
import UserAdminComponent from './admin/users/UserAdminComponent.jsx';
import ProfileComponent from './profile/ProfileComponent.jsx';
import AdminDashboardComponent from './admin/AdminDashboardComponent.jsx';
import OrdersKanbanComponent from './admin/orders/OrdersKanbanComponent.jsx';
import OrdersReportComponent from './admin/orders/OrdersReportComponent.jsx';
import MyOrdersComponent from './orders/MyOrdersComponent.jsx';
import AgeVerificationModal from './ui/AgeVerificationModal.jsx';
import AuthenticationService from '../services/AuthenticationService.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
const SupplierManagementPage = React.lazy(() => import('./admin/suppliers/SupplierManagementPage'));

const ADMIN_ROLES = ['admin'];

function AgeVerificationRoute({ location, navigate }) {
    const allowedPaths = ['/', '/welcome', '/cart', '/shop'];
    if (!AuthenticationService.isUserLoggedIn() && allowedPaths.includes(location.pathname)) {
        return <AgeVerificationModal navigate={navigate} />;
    }
    return null;
}

const AgeVerificationRouteWrapper = navigationComponent(AgeVerificationRoute);
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

function SupplierPageFallback() {
    return (
        <div className="hu-mx-auto hu-max-w-7xl hu-px-4 hu-py-8 hu-text-sm hu-text-slate-600" role="status">
            Cargando gestión de proveedores…
        </div>
    );
}

function SupplierRoute() {
    return (
        <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <Suspense fallback={<SupplierPageFallback />}>
                <SupplierManagementPage />
            </Suspense>
        </ProtectedRoute>
    );
}

function GrowShopApp() {
    return (
        <div className="App hu-min-h-screen">
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
                        <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboardComponent /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><UserAdminComponentWithNavigation /></ProtectedRoute>} />
                        <Route path="/admin/proveedores" element={<SupplierRoute />} />
                        <Route path="/admin/proveedores/:id" element={<SupplierRoute />} />
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

export default GrowShopApp;