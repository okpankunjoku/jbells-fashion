
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { useCart } from "../context/CartContext.jsx";

function PublicLayout() {
  const { cartCount } = useCart();

  return (
    <div className="store">
      <Navbar cartCount={cartCount} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
