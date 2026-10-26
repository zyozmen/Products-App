import React, { Suspense } from 'react';
import LoginComponent from './login/LoginComponent.jsx';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import navigationComponent from './navigation/NavigationComponent.jsx'  
import paramsComponent from './navigation/NavigationParamsComponent.jsx';
import ErrorComponent from './login/ErrorComponent.jsx';
import WelcomeComponent from './dashboard/WelcomeComponent.jsx';
import ShopComponent from './shop/ShopComponent.jsx';
import ProductDetailComponent from './shop/ProductDetail/ProductDetailComponent.jsx';
import MarketplaceProductDetail from './shop/MarketplaceProductDetail.jsx';
import HeaderComponent from './dashboard/HeaderComponent.jsx';
import FooterComponent from './dashboard/FooterComponent.jsx';
import CreateProductComponent from './admin/products/CreateProductComponent.jsx';
import ShoppingCarComponent from './cart/ShoppingCarComponent.jsx';
import UserAdminComponent from './admin/users/UserAdminComponent.jsx';
import ProfileComponent from './profile/ProfileComponent.jsx';
import CategoryManagementComponent from './admin/categories/CategoryManagementComponent.jsx';
import AdminDashboardComponent from './admin/AdminDashboardComponent.jsx';
import OrdersKanbanComponent from './admin/orders/OrdersKanbanComponent.jsx';
import OrdersReportComponent from './admin/orders/OrdersReportComponent.jsx';
import MyOrdersComponent from './orders/MyOrdersComponent.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import AgeVerificationRouteGate from './auth/AgeVerificationRouteGate.jsx';
const SupplierManagementPage = React.lazy(() => import('./admin/suppliers/SupplierManagementPage'));
const CepaManagementPage = React.lazy(() => import('./admin/cepas/CepaManagementPage'));
const DailySettlementPage = React.lazy(() => import('./admin/settlements/DailySettlementPage'));

const ADMIN_ROLES = ['admin'];

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
const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
const FooterComponentWithNavigation = navigationComponent(FooterComponent);

function SupplierPageFallback() {
    return (
        <div className="hu-mx-auto hu-max-w-7xl hu-px-4 hu-py-8 hu-text-sm hu-text-slate-600" role="status">
            Cargando gestión de proveedores…
        </div>
    );
}

class SupplierPageErrorBoundary extends React.Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        console.error('No se pudo mostrar la gestión de proveedores.', error);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="admin-page-bg hu-flex hu-min-h-screen hu-items-center hu-justify-center hu-p-6 hu-text-slate-900">
                    <div className="hu-w-full hu-max-w-xl hu-rounded-2xl hu-border hu-border-red-200 hu-bg-white hu-p-6 hu-shadow-panel">
                        <h1 className="hu-m-0 hu-text-xl hu-font-bold">No se pudo mostrar el detalle del proveedor</h1>
                        <p className="hu-mb-0 hu-mt-2 hu-text-sm hu-text-slate-600">
                            Ocurrió un error al cargar esta pantalla. Recarga para intentarlo nuevamente.
                        </p>
                        {this.state.error instanceof Error && (
                            <pre className="hu-mb-0 hu-mt-4 hu-overflow-auto hu-whitespace-pre-wrap hu-rounded-lg hu-bg-slate-50 hu-p-3 hu-text-xs hu-text-slate-700">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            type="button"
                            className="hu-mt-5 hu-inline-flex hu-cursor-pointer hu-items-center hu-justify-center hu-rounded-lg hu-border-0 hu-bg-green-700 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-white hover:hu-bg-green-800"
                            onClick={() => window.location.reload()}
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function SupplierRoute() {
    return (
        <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <SupplierPageErrorBoundary>
                <Suspense fallback={<SupplierPageFallback />}>
                    <SupplierManagementPage />
                </Suspense>
            </SupplierPageErrorBoundary>
        </ProtectedRoute>
    );
}

function GrowShopApp() {
    return (
        <div className="App hu-min-h-screen">
            <BrowserRouter>
                <AuthProvider>
                    <AgeVerificationRouteGate>
                        <Routes>
                            <Route path="/login" element={<LoginComponentWithNavigation />} />
                            <Route path="/" element={<WelcomeComponent />} />
                            <Route path="/welcome" element={<WelcomeComponent />} />
                            <Route path="/shop" element={<ShopComponentWithNavigation />} />
                            <Route path="/cart" element={<ShoppingCarComponentWithNavigation />} />
                            <Route path="/welcome/:name" element={<ProtectedRoute><WelcomeComponentWithParams /></ProtectedRoute>} />
                            <Route path="/product/:id" element={<ProtectedRoute><ProductDetailComponentWithParams /></ProtectedRoute>} />
                            <Route path="/producto/:cepaId/:presentacionId" element={<><HeaderComponentWithNavigation /><MarketplaceProductDetail /><FooterComponentWithNavigation /></>} />
                            <Route path="/createProduct" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateProductComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="/editProduct/:productId" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateProductComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboardComponent /></ProtectedRoute>} />
                            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><UserAdminComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="/admin/proveedores" element={<SupplierRoute />} />
                            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CategoryManagementComponent /></ProtectedRoute>} />
                            <Route path="/admin/proveedores/:id" element={<SupplierRoute />} />
                            <Route path="/admin/cepas" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Suspense fallback={<SupplierPageFallback />}><CepaManagementPage /></Suspense></ProtectedRoute>} />
                            <Route path="/admin/liquidacion" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Suspense fallback={<SupplierPageFallback />}><DailySettlementPage /></Suspense></ProtectedRoute>} />
                            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><OrdersKanbanComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="/admin/orders/report" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><OrdersReportComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="/orders" element={<ProtectedRoute><MyOrdersComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><ProfileComponentWithNavigation /></ProtectedRoute>} />
                            <Route path="*" element={<ErrorComponent />} />
                        </Routes>
                    </AgeVerificationRouteGate>
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default GrowShopApp;