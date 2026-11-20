
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  UserRound,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

import logo from "../assets/jbells-logo.png";

function Navbar({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("jbells-user")) || null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(sessionStorage.getItem("jbells-token"))
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  useEffect(() => {
    function updateUser() {
      try {
        setUser(JSON.parse(sessionStorage.getItem("jbells-user")) || null);
      } catch {
        setUser(null);
      }

      setIsLoggedIn(Boolean(sessionStorage.getItem("jbells-token")));
    }

    updateUser();

    window.addEventListener("storage", updateUser);
    window.addEventListener("jbells-auth-changed", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("jbells-auth-changed", updateUser);
    };
  }, [location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    sessionStorage.removeItem("jbells-token");
    sessionStorage.removeItem("jbells-user");

    setUser(null);
    setIsLoggedIn(false);
    setMenuOpen(false);

    window.dispatchEvent(new Event("jbells-auth-changed"));
    navigate("/", { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link
          to="/"
          className="brand"
          aria-label="JBELLS Home"
          onClick={closeMenu}
        >
          <img src={logo} alt="JBELLS" />
        </Link>

        <nav
          className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}
          id="main-navigation"
        >
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/categories" onClick={closeMenu}>
            Categories
          </Link>

          <Link to="/shop" onClick={closeMenu}>
            Shop
          </Link>

          <Link to="/about" onClick={closeMenu}>
            About
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>

          {isLoggedIn && isAdmin && (
            <Link to="/admin" onClick={closeMenu}>
              <LayoutDashboard size={16} />
              Admin Dashboard
            </Link>
          )}

          {isLoggedIn && !isAdmin && (
            <Link to="/account" onClick={closeMenu}>
              <UserRound size={16} />
              My Account
            </Link>
          )}

          {!isLoggedIn ? (
            <>
              <Link to="/login" onClick={closeMenu}>
                Login
              </Link>

              <Link
                to="/register"
                className="nav-register"
                onClick={closeMenu}
              >
                Register
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="filter-button navbar-logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </nav>

        <div className="navbar-actions">
          <Link
            to="/cart"
            className="cart-button"
            onClick={closeMenu}
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <ShoppingBag size={18} />
            <span className="cart-label">Cart</span>
            <span className="cart-count">{cartCount}</span>
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
