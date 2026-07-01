import { Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import HomePage from "./pages/HomePage";
import StorePage from "./pages/StorePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AccountPage from "./pages/AccountPage";
import ProductDetailPage from "./pages/ProductDetailPage";

import WhatsAppFloat from "./components/WhatsAppFloat";
import AdminLayout from "./admin/AdminLayout";
import AuthGuard from "./admin/AuthGuard";
import AdminLoginPage from "./admin/LoginPage";
import DashboardPage from "./admin/DashboardPage";
import ProductsPage from "./admin/ProductsPage";
import ProductFormPage from "./admin/ProductFormPage";
import OrdersPage from "./admin/OrdersPage";
import OrderDetailPage from "./admin/OrderDetailPage";

export default function App() {
  const location = useLocation();
  const hideWhatsApp = location.pathname.startsWith("/admin") || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <CartProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/edit/:id" element={<ProductFormPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Routes>
      {!hideWhatsApp && <WhatsAppFloat />}
      </CartProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}