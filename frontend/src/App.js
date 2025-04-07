import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Komponenty pro layout
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';

// Veřejné stránky
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Nový vylepšený formulář výpůjčky
import ImprovedAddRentalForm from './pages/orders/ImprovedAddRentalForm';

// Chráněné stránky
import Dashboard from './pages/dashboard/Dashboard';
import EquipmentList from './pages/equipment/EquipmentList';
import EquipmentDetail from './pages/equipment/EquipmentDetail';
import EquipmentForm from './pages/equipment/EquipmentForm';
import ExternalEquipmentForm from './pages/equipment/ExternalEquipmentForm';

// Komponenty pro dodavatele
import SupplierList from './pages/suppliers/SupplierList';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import SupplierForm from './pages/suppliers/SupplierForm';

// Komponenty pro sklady
import WarehouseList from './pages/warehouses/WarehouseList';
import WarehouseDetail from './pages/warehouses/WarehouseDetail';
import WarehouseForm from './pages/warehouses/WarehouseForm';
import CategoryList from './pages/categories/CategoryList';
import CategoryForm from './pages/categories/CategoryForm';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderForm from './pages/orders/OrderForm';
import NewOrderForm from './pages/orders/NewOrderForm';
import AddRentalForm from './pages/orders/AddRentalForm';
import BatchRentalReturnForm from './pages/orders/BatchRentalReturnForm';

// Dokumenty
import DeliveryNote from './pages/orders/DeliveryNote';
import BillingData from './pages/orders/BillingData';

// Nové komponenty pro hromadné dodací listy
import BatchDeliveryNote from './pages/orders/BatchDeliveryNote';
import BatchReturnNote from './pages/orders/BatchReturnNote';

// Komponenty pro správu uživatelů
import UserList from './pages/users/UserList';
import UserDetail from './pages/users/UserDetail';
import UserForm from './pages/users/UserForm';
import UserAccessForm from './pages/users/UserAccessForm';

// Komponenty pro prodeje, odpisy a inventury
import SaleList from './pages/sales/SaleList';
import SaleDetail from './pages/sales/SaleDetail';
import SaleForm from './pages/sales/SaleForm';
import WriteOffList from './pages/write-offs/WriteOffList';
import WriteOffDetail from './pages/write-offs/WriteOffDetail';
import WriteOffForm from './pages/write-offs/WriteOffForm';
import InventoryCheckList from './pages/inventory/InventoryCheckList';
import InventoryCheckDetail from './pages/inventory/InventoryCheckDetail';
import InventoryCheckForm from './pages/inventory/InventoryCheckForm';

// Kontext pro autentizaci
import { AuthProvider, useAuth } from './context/AuthContext';

// Komponenta pro ochranu admin tras
function PrivateAdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kontrola, zda je uživatel admin
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Refaktor pro použití s router v6
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, token } = useAuth();
  
  // Explicitně nastavit token při každém renderování App
  useEffect(() => {
    if (token) {
      try {
        // Import axios a nastavení hlavičky - použijeme import namísto require
        import('axios').then(axiosModule => {
          const axios = axiosModule.default;
          if (axios && axios.defaults && axios.defaults.headers) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('Token byl nastaven pro globální axios');
          }
        }).catch(err => {
          console.error('Chyba při importu axios:', err);
        });
        
        // Import našeho konfigurovaného axios a nastavení hlavičky
        import('./axios-config').then(configModule => {
          const configuredAxios = configModule.default;
          if (configuredAxios && configuredAxios.defaults && configuredAxios.defaults.headers) {
            configuredAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('Token byl nastaven pro konfigurovaný axios');
          }
        }).catch(err => {
          console.error('Chyba při importu axios-config:', err);
        });
      } catch (error) {
        console.error('Chyba při nastavování tokenu v hlavičkách:', error);
      }
    }
  }, [token]);
  
  return (
    <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <Navigation />
          <main className="flex-grow-1 py-4">
            <div className="container">
              <Routes>
                {/* Veřejné routy */}
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
                
                {/* Chráněné routy */}
                <Route path="/dashboard" element={
                  <div>
                    <Dashboard />
                  </div>
                } />
                
                {/* Equipment routes - pouze pro adminy */}
                <Route 
                  path="/equipment/new" 
                  element={
                    <PrivateAdminRoute>
                      <EquipmentForm />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/equipment/external/new" 
                  element={
                    <PrivateAdminRoute>
                      <ExternalEquipmentForm />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/equipment/edit/:id" 
                  element={
                    <PrivateAdminRoute>
                      <EquipmentForm />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/equipment/external/edit/:id" 
                  element={
                    <PrivateAdminRoute>
                      <ExternalEquipmentForm />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/equipment/:id" 
                  element={
                    <PrivateAdminRoute>
                      <EquipmentDetail />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/equipment" 
                  element={
                    <PrivateAdminRoute>
                      <EquipmentList />
                    </PrivateAdminRoute>
                  } 
                />
                
                {/* Category routes - pouze pro adminy */}
                <Route 
                  path="/categories/new" 
                  element={
                    <PrivateAdminRoute>
                      <CategoryForm />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/categories/edit/:id" 
                  element={
                    <PrivateAdminRoute>
                      <CategoryForm />
                    </PrivateAdminRoute>
                  } 
                />
                <Route 
                  path="/categories" 
                  element={
                    <PrivateAdminRoute>
                      <CategoryList />
                    </PrivateAdminRoute>
                  } 
                />
                
                {/* Customer routes - nejprve specifické, pak obecné */}
                <Route path="/customers/new" element={<CustomerForm />} />
                <Route path="/customers/edit/:id" element={<CustomerForm />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/customers" element={<CustomerList />} />
                
                {/* Order routes - přeuspořádáno pro vyřešení konfliktu */}
                {/* 1. Nejprve specifické cesty bez parametrů */}
                <Route path="/orders/new" element={<OrderForm />} />
                <Route path="/orders/new-form" element={<NewOrderForm />} />
                <Route path="/orders/batch-return" element={<BatchRentalReturnForm />} />
                
                {/* 2. Specifické cesty s parametry */}
                <Route path="/orders/edit/:id" element={<OrderForm />} />
                <Route path="/orders/edit-new/:id" element={<NewOrderForm />} />
                <Route path="/orders/batch-rentals/:batch_id/delivery-note" element={<BatchDeliveryNote />} />
                <Route path="/orders/batch-returns/:batch_id/delivery-note" element={<BatchReturnNote />} />
                
                {/* 3. Cesty s order_id parametrem */}
                <Route path="/orders/:order_id/add-rental" element={<ImprovedAddRentalForm />} />
                <Route path="/orders/:order_id/delivery-note" element={<DeliveryNote />} />
                <Route path="/orders/:order_id/billing-data/:billing_id" element={<BillingData />} />
                <Route path="/orders/:order_id/billing-data" element={<BillingData />} />
                
                {/* 4. Detail zakázky - obecná cesta s parametrem */}
                <Route path="/orders/:id" element={<OrderDetail />} />
                
                {/* 5. Seznam zakázek - nejobecnější cesta */}
                <Route path="/orders" element={<OrderList />} />
                
                {/* Supplier routes - správa dodavatelů */}
                <Route path="/suppliers" element={<SupplierList />} />
                <Route path="/suppliers/new" element={<SupplierForm />} />
                <Route path="/suppliers/edit/:id" element={<SupplierForm />} />
                <Route path="/suppliers/:id" element={<SupplierDetail />} />
                
                {/* Warehouse routes - správa skladů */}
                <Route path="/warehouses" element={<WarehouseList />} />
                <Route path="/warehouses/new" element={<WarehouseForm />} />
                <Route path="/warehouses/edit/:id" element={<WarehouseForm />} />
                <Route path="/warehouses/:id" element={<WarehouseDetail />} />
                
                {/* User routes - správa uživatelů */}
                <Route path="/users" element={<UserList />} />
                <Route path="/users/new" element={<UserForm />} />
                <Route path="/users/edit/:id" element={<UserForm />} />
                <Route path="/users/:id/access" element={<UserAccessForm />} />
                <Route path="/users/:id" element={<UserDetail />} />
                
                {/* Sales routes - správa prodejů */}
                <Route path="/sales" element={<SaleList />} />
                <Route path="/sales/new" element={<SaleForm />} />
                <Route path="/sales/edit/:id" element={<SaleForm />} />
                <Route path="/sales/:id" element={<SaleDetail />} />
                
                {/* Write-offs routes - správa odpisů */}
                <Route path="/write-offs" element={<WriteOffList />} />
                <Route path="/write-offs/new" element={<WriteOffForm />} />
                <Route path="/write-offs/edit/:id" element={<WriteOffForm />} />
                <Route path="/write-offs/:id" element={<WriteOffDetail />} />
                
                {/* Inventory check routes - správa inventur */}
                <Route path="/inventory-checks" element={<InventoryCheckList />} />
                <Route path="/inventory-checks/new" element={<InventoryCheckForm />} />
                <Route path="/inventory-checks/edit/:id" element={<InventoryCheckForm />} />
                <Route path="/inventory-checks/:id" element={<InventoryCheckDetail />} />
                
                {/* Chybějící stránka */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
  );
}

export default App;

