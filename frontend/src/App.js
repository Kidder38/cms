import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Komponenty pro layout
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';

// Veřejné stránky
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Chráněné stránky
import Dashboard from './pages/dashboard/Dashboard';
import EquipmentList from './pages/equipment/EquipmentList';
import EquipmentDetail from './pages/equipment/EquipmentDetail';
import EquipmentForm from './pages/equipment/EquipmentForm';
import CategoryList from './pages/categories/CategoryList';
import CategoryForm from './pages/categories/CategoryForm';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderForm from './pages/orders/OrderForm';
import AddRentalForm from './pages/orders/AddRentalForm';
import BatchRentalReturnForm from './pages/orders/BatchRentalReturnForm';

// Dokumenty
import DeliveryNote from './pages/orders/DeliveryNote';
import BillingData from './pages/orders/BillingData';

// Nové komponenty pro hromadné dodací listy
import BatchDeliveryNote from './pages/orders/BatchDeliveryNote';
import BatchReturnNote from './pages/orders/BatchReturnNote';

// Kontext pro autentizaci
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <Navigation />
          <main className="flex-grow-1 py-4">
            <div className="container">
              <Routes>
                {/* Veřejné routy */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Chráněné routy */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/equipment" element={<EquipmentList />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/equipment/new" element={<EquipmentForm />} />
                <Route path="/equipment/edit/:id" element={<EquipmentForm />} />
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/categories/new" element={<CategoryForm />} />
                <Route path="/categories/edit/:id" element={<CategoryForm />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/customers/new" element={<CustomerForm />} />
                <Route path="/customers/edit/:id" element={<CustomerForm />} />
                <Route path="/orders" element={<OrderList />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/orders/new" element={<OrderForm />} />
                <Route path="/orders/edit/:id" element={<OrderForm />} />
                <Route path="/orders/:order_id/add-rental" element={<AddRentalForm />} />

                {/* Dodací listy a faktury */}
                <Route path="/orders/:order_id/delivery-note" element={<DeliveryNote />} />
                <Route path="/orders/:order_id/billing-data" element={<BillingData />} />
                
                {/* Nové cesty pro hromadné dodací listy */}
                <Route path="/orders/batch-rentals/:batch_id/delivery-note" element={<BatchDeliveryNote />} />
                <Route path="/orders/batch-returns/:batch_id/delivery-note" element={<BatchReturnNote />} />
                <Route path="/orders/batch-return" element={<BatchRentalReturnForm />} />
                {/* Chybějící stránka */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;