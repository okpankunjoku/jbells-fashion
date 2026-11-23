
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  Warehouse,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Shirt,
  CircleDollarSign,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import API from "../api/api";
import "../App.css";

import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import AdminInventory from "./AdminInventory";
import AdminOrders from "./AdminOrders";
import AdminSalesReports from "./AdminSalesReports";
import AdminSettings from "./AdminSettings";
import AdminCustomers from "./AdminCustomers";

const initialSummary = {
  totalRevenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
  totalCategories: 0,
  pendingOrders: 0,
  lowStockCount: 0,
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [summary, setSummary] = useState(initialSummary);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("jbells-user")) || {};
    } catch {
      return {};
    }
  })();

  const adminName =
    `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim() ||
    "JBELLS Administrator";

  const navigationItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Products", icon: Package },
    { label: "Categories", icon: Tags },
    { label: "Orders", icon: ShoppingBag },
    { label: "Customers", icon: Users },
    { label: "Inventory", icon: Warehouse },
    { label: "Sales Reports", icon: BarChart3 },
    { label: "Settings", icon: Settings },
  ];

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/dashboard");

      if (!response.data?.success || !response.data?.summary) {
        throw new Error("The dashboard returned an unexpected response.");
      }

      setSummary({
        ...initialSummary,
        ...response.data.summary,
      });

      setRecentOrders(
        Array.isArray(response.data.recentOrders)
          ? response.data.recentOrders
          : []
      );

      setLowStockProducts(
        Array.isArray(response.data.lowStockProducts)
          ? response.data.lowStockProducts
          : []
      );
    } catch (err) {
      console.error("Dashboard loading error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        sessionStorage.removeItem("jbells-token");
        sessionStorage.removeItem("jbells-user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleLogout() {
    sessionStorage.removeItem("jbells-token");
    sessionStorage.removeItem("jbells-user");
    navigate("/login", { replace: true });
  }

  function selectSection(section) {
    setActiveSection(section);
    setMenuOpen(false);
  }

  const statistics = [
    {
      label: "Total Orders",
      value: summary.totalOrders.toLocaleString("en-NG"),
      icon: ShoppingBag,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: CircleDollarSign,
    },
    {
      label: "Total Products",
      value: summary.totalProducts.toLocaleString("en-NG"),
      icon: Shirt,
    },
    {
      label: "Total Customers",
      value: summary.totalCustomers.toLocaleString("en-NG"),
      icon: Users,
    },
  ];

  return (
    <div className="admin-page">
      <aside
        className={`admin-sidebar ${
          menuOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <Link to="/">JBELLS</Link>
          <span>ADMINISTRATION</span>
        </div>

        <div className="admin-profile">
          <div className="admin-profile-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <p className="admin-menu-heading">MAIN MENU</p>

        <nav className="admin-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={
                  activeSection === item.label
                    ? "admin-nav-item active"
                    : "admin-nav-item"
                }
                onClick={() => selectSection(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                <ChevronRight size={15} />
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="admin-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          Sign Out
        </button>

        <Link to="/" className="admin-store-link">
          Return to Store
        </Link>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle administration menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <div className="admin-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search administration..."
              aria-label="Search administration"
            />
          </div>

          <div className="admin-topbar-user">
            <Bell size={20} />
            <span>{adminName}</span>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">
                JBELLS STORE MANAGEMENT
              </p>

              <h1>{activeSection}</h1>

              <p>
                Welcome to your JBELLS administration panel.
              </p>
            </div>

            <button
              type="button"
              className="admin-date"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw size={14} />
              {loading ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          </div>

          {activeSection === "Dashboard" ? (
            <>
              {error && (
                <div className="admin-data-error" role="alert">
                  <AlertTriangle size={19} />
                  <span>{error}</span>

                  <button type="button" onClick={loadDashboard}>
                    Retry
                  </button>
                </div>
              )}

              <div className="admin-stat-grid">
                {statistics.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      className="admin-stat-card"
                      key={stat.label}
                    >
                      <div className="admin-stat-icon">
                        <Icon />
                      </div>

                      <span>{stat.label}</span>

                      <h2>
                        {loading ? "..." : stat.value}
                      </h2>

                      <small>
                        {loading
                          ? "Loading information..."
                          : "Live database information"}
                      </small>
                    </div>
                  );
                })}
              </div>

              <div className="admin-stat-grid admin-extra-stats">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <ClipboardList />
                  </div>

                  <span>Pending Orders</span>

                  <h2>
                    {loading ? "..." : summary.pendingOrders}
                  </h2>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Tags />
                  </div>

                  <span>Active Categories</span>

                  <h2>
                    {loading ? "..." : summary.totalCategories}
                  </h2>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <AlertTriangle />
                  </div>

                  <span>Low Stock Variants</span>

                  <h2>
                    {loading ? "..." : summary.lowStockCount}
                  </h2>
                </div>
              </div>

              <div className="admin-dashboard-grid">
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h2>Recent Orders</h2>
                      <p>Your latest customer orders</p>
                    </div>

                    <TrendingUp size={21} />
                  </div>

                  {loading ? (
                    <p>Loading recent orders...</p>
                  ) : recentOrders.length === 0 ? (
                    <div className="admin-overview-message">
                      <ClipboardList size={35} />

                      <h3>No orders yet</h3>

                      <p>
                        Customer orders will appear here when purchases
                        are placed.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>

                        <tbody>
                          {recentOrders.map((order, index) => (
                            <tr key={order._id || index}>
                              <td>
                                {order.orderNumber || "Order"}
                              </td>

                              <td>
                                {order.user
                                  ? `${order.user.firstName || ""} ${
                                      order.user.lastName || ""
                                    }`.trim() ||
                                    order.user.email ||
                                    "Customer"
                                  : "Customer"}
                              </td>

                              <td>
                                {formatCurrency(order.totalAmount)}
                              </td>

                              <td>
                                {order.orderStatus || "Pending"}
                              </td>

                              <td>
                                {formatDate(order.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h2>Quick Management</h2>
                      <p>Access important store sections</p>
                    </div>
                  </div>

                  <div className="admin-quick-links">
                    {[
                      ["Products", Package],
                      ["Orders", ShoppingBag],
                      ["Inventory", Warehouse],
                      ["Customers", Users],
                    ].map(([label, Icon]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => selectSection(label)}
                      >
                        <Icon size={19} />
                        <span>{label}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <section className="admin-panel admin-low-stock-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Low Stock Alerts</h2>
                    <p>
                      Product variations with five or fewer units
                    </p>
                  </div>

                  <AlertTriangle size={21} />
                </div>

                {loading ? (
                  <p>Loading inventory information...</p>
                ) : lowStockProducts.length === 0 ? (
                  <p className="admin-empty-message">
                    No low-stock product variations found.
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Size</th>
                          <th>Colour</th>
                          <th>Available Stock</th>
                        </tr>
                      </thead>

                      <tbody>
                        {lowStockProducts.map((item, index) => (
                          <tr
                            key={`${item.productId}-${item.sku}-${index}`}
                          >
                            <td>{item.productName}</td>
                            <td>{item.sku}</td>
                            <td>{item.size}</td>
                            <td>{item.color}</td>
                            <td>{item.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : activeSection === "Products" ? (
            <AdminProducts />
          ) : activeSection === "Categories" ? (
            <AdminCategories />
          ) : activeSection === "Orders" ? (
            <AdminOrders />
          ) : activeSection === "Customers" ? (
            <AdminCustomers />
          ) : activeSection === "Inventory" ? (
            <AdminInventory />
          ) : activeSection === "Sales Reports" ? (
            <AdminSalesReports />
          ) : activeSection === "Settings" ? (
            <AdminSettings />
          ) : (
            <section className="admin-panel admin-section-placeholder">
              <ClipboardList size={38} />

              <h2>{activeSection}</h2>

              <p>
                The {activeSection.toLowerCase()} management section
                will be developed and connected to the backend in
                the next stages.
              </p>

              <button
                type="button"
                onClick={() => selectSection("Dashboard")}
              >
                Return to Dashboard
              </button>
            </section>
          )}
        </div>

        <footer className="admin-footer">
          <span>
            © {new Date().getFullYear()} JBELLS. All rights reserved.
          </span>

          <span>Administration Panel</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
