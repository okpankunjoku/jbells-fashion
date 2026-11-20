
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Shop from "./pages/Shop.jsx";
import Cart from "./pages/Cart.jsx";

import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders from "./pages/Orders.jsx";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

import Account from "./pages/Account.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import Categories from "./pages/Categories.jsx";

import { CartProvider } from "./context/CartContext.jsx";

function App() {
  return (
    <CartProvider>
      <Routes>

        {/* Public storefront pages share one Navbar and Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/categories" element={<Categories />} />
        </Route>

        {/* Authentication pages */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/verify-email/:token"
          element={<VerifyEmail />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Customer protected pages */}
        <Route
          element={<ProtectedRoute allowedRoles={["customer"]} />}
        >
          <Route path="/account" element={<Account />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/order-success/:orderId"
            element={<OrderSuccess />}
          />
          <Route path="/orders" element={<Orders />} />
        </Route>

        {/* Admin protected pages - separate from storefront layout */}
        <Route
          element={<ProtectedRoute allowedRoles={["admin"]} />}
        >
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* 404 page */}
        <Route
          path="*"
          element={
            <div style={{ padding: "50px", textAlign: "center" }}>
              <h1>404 - Page Not Found</h1>
              <a href="/">Return to Homepage</a>
            </div>
          }
        />

      </Routes>
    </CartProvider>
  );
}

export default App;
