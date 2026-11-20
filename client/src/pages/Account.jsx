
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound, ShoppingBag, MapPin, ShieldCheck, LogOut, Menu, X,
  ChevronRight, Package, RefreshCw, XCircle, Pencil, Save,
  Plus, Trash2, Star,
} from "lucide-react";
import API from "../api/api";
import "../App.css";

const money = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG")}`;

const dateLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-NG", {
        day: "numeric", month: "long", year: "numeric",
      });
};

const label = (value) =>
  String(value || "Not available")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function Account() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [menuOpen, setMenuOpen] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("jbells-user")) || {};
    } catch {
      return {};
    }
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [cancellingId, setCancellingId] = useState("");
  const [orderMessage, setOrderMessage] = useState("");

  // Saved delivery addresses.
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressMessage, setAddressMessage] = useState("");
  const [editingAddressId, setEditingAddressId] = useState("");
  const [deletingAddressId, setDeletingAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const emptyAddressForm = {
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    deliveryInstructions: "",
    isDefault: false,
  };

  const [addressForm, setAddressForm] = useState(emptyAddressForm);

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi",
    "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
    "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
    "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara",
  ];

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "JBELLS Customer";

  // Load the latest profile directly from the backend.
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError("");

      const response = await API.get("/users/me");
      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error("Profile information was not returned.");
      }

      setUser((previousUser) => {
        const mergedUser = { ...previousUser, ...updatedUser };
        sessionStorage.setItem("jbells-user", JSON.stringify(mergedUser));
        return mergedUser;
      });

      setProfileForm({
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        phone: updatedUser.phone || "",
      });
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
          error.message ||
          "Unable to retrieve your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function startEditingProfile() {
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
    });
    setProfileError("");
    setProfileMessage("");
    setEditingProfile(true);
  }

  function cancelEditingProfile() {
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
    });
    setProfileError("");
    setProfileMessage("");
    setEditingProfile(false);
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const phone = profileForm.phone.trim();

    if (!firstName || !lastName) {
      setProfileError("First name and last name are required.");
      return;
    }

    if (firstName.length > 50 || lastName.length > 50) {
      setProfileError("Names cannot exceed 50 characters.");
      return;
    }

    if (phone.length > 25) {
      setProfileError("Phone number cannot exceed 25 characters.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError("");
      setProfileMessage("");

      const response = await API.put("/users/me", {
        firstName,
        lastName,
        phone,
      });

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error("The server did not return the updated profile.");
      }

      setUser((previousUser) => {
        const mergedUser = { ...previousUser, ...updatedUser };
        sessionStorage.setItem("jbells-user", JSON.stringify(mergedUser));
        window.dispatchEvent(new Event("jbells-auth-changed"));
        return mergedUser;
      });

      setProfileForm({
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        phone: updatedUser.phone || "",
      });

      setEditingProfile(false);
      setProfileMessage(
        response.data.message || "Your profile was updated successfully."
      );
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save your profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await API.get("/orders/my-orders", {
        params: { page, limit: 10 },
      });

      const data = response.data || {};

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setCurrentPage(Number(data.currentPage || page));
      setTotalPages(Math.max(1, Number(data.totalPages || 1)));
      setTotalOrders(Number(data.totalOrders || 0));
    } catch (error) {
      console.error("Unable to load customer orders:", error);

      setOrdersError(
        error.response?.data?.message ||
        (error.response?.status === 401
          ? "Your session has expired. Please sign in again."
          : "Unable to load your orders. Please try again.")
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders(currentPage);
  }, [activeTab, currentPage, fetchOrders]);

  function handleLogout() {
    sessionStorage.removeItem("jbells-token");
    sessionStorage.removeItem("jbells-user");
    window.dispatchEvent(new Event("jbells-auth-changed"));
    navigate("/login", { replace: true });
  }

  function selectTab(tab) {
    setActiveTab(tab);
    setMenuOpen(false);
  }

  async function cancelOrder(order) {
    if (!order?._id) return;

    if (!window.confirm(`Cancel order ${order.orderNumber || ""}?`)) return;

    try {
      setCancellingId(order._id);
      setOrderMessage("");

      const response = await API.put(`/orders/${order._id}/cancel`);

      setOrderMessage(
        response.data?.message || "Order cancelled successfully."
      );

      await fetchOrders(currentPage);
    } catch (error) {
      setOrderMessage(
        error.response?.data?.message || "Unable to cancel this order."
      );
    } finally {
      setCancellingId("");
    }
  }


  // Retrieve saved delivery addresses.
  const fetchAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      setAddressError("");

      const response = await API.get("/users/addresses");

      setAddresses(
        Array.isArray(response.data?.addresses)
          ? response.data.addresses
          : []
      );
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to retrieve your saved addresses."
      );
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "addresses") {
      fetchAddresses();
    }
  }, [activeTab, fetchAddresses]);

  function handleAddressChange(event) {
    const { name, value, type, checked } = event.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startAddingAddress() {
    setEditingAddressId("");
    setAddressForm({
      ...emptyAddressForm,
      fullName: fullName === "JBELLS Customer" ? "" : fullName,
      phone: user.phone || "",
      isDefault: addresses.length === 0,
    });
    setAddressError("");
    setAddressMessage("");
    setShowAddressForm(true);
  }

  function startEditingAddress(address) {
    setEditingAddressId(address._id);
    setAddressForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      deliveryInstructions: address.deliveryInstructions || "",
      isDefault: Boolean(address.isDefault),
    });
    setAddressError("");
    setAddressMessage("");
    setShowAddressForm(true);
  }

  function cancelAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId("");
    setAddressForm(emptyAddressForm);
    setAddressError("");
  }

  async function saveAddress(event) {
    event.preventDefault();

    const requiredFields = [
      ["fullName", "Full name"],
      ["phone", "Phone number"],
      ["address", "Street address"],
      ["city", "City"],
      ["state", "State"],
    ];

    for (const [field, fieldLabel] of requiredFields) {
      if (!addressForm[field].trim()) {
        setAddressError(`${fieldLabel} is required.`);
        return;
      }
    }

    if (addressForm.fullName.trim().length > 100) {
      setAddressError("Full name cannot exceed 100 characters.");
      return;
    }
    if (addressForm.phone.trim().length > 20) {
      setAddressError("Phone number cannot exceed 20 characters.");
      return;
    }
    if (addressForm.address.trim().length > 200) {
      setAddressError("Street address cannot exceed 200 characters.");
      return;
    }
    if (addressForm.deliveryInstructions.length > 500) {
      setAddressError("Delivery instructions cannot exceed 500 characters.");
      return;
    }

    try {
      setAddressSaving(true);
      setAddressError("");
      setAddressMessage("");

      const payload = {
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        address: addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state,
        postalCode: addressForm.postalCode.trim(),
        deliveryInstructions: addressForm.deliveryInstructions.trim(),
        isDefault: addressForm.isDefault,
      };

      const response = editingAddressId
        ? await API.put(`/users/addresses/${editingAddressId}`, payload)
        : await API.post("/users/addresses", payload);

      if (Array.isArray(response.data?.addresses)) {
        setAddresses(response.data.addresses);
      } else {
        await fetchAddresses();
      }

      setAddressMessage(
        response.data?.message || "Address saved successfully."
      );
      setShowAddressForm(false);
      setEditingAddressId("");
      setAddressForm(emptyAddressForm);
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to save this address. Please try again."
      );
    } finally {
      setAddressSaving(false);
    }
  }

  async function makeDefaultAddress(addressId) {
    try {
      setAddressError("");
      setAddressMessage("");

      const response = await API.patch(
        `/users/addresses/${addressId}/default`
      );

      if (Array.isArray(response.data?.addresses)) {
        setAddresses(response.data.addresses);
      } else {
        await fetchAddresses();
      }

      setAddressMessage(
        response.data?.message || "Default address updated."
      );
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to update the default address."
      );
    }
  }

  async function deleteAddress(address) {
    if (!address?._id) return;

    if (
      !window.confirm(
        `Are you sure you want to delete the address in ${address.city}?`
      )
    ) {
      return;
    }

    try {
      setDeletingAddressId(address._id);
      setAddressError("");
      setAddressMessage("");

      const response = await API.delete(
        `/users/addresses/${address._id}`
      );

      if (Array.isArray(response.data?.addresses)) {
        setAddresses(response.data.addresses);
      } else {
        await fetchAddresses();
      }

      setAddressMessage(
        response.data?.message || "Address deleted successfully."
      );
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to delete this address."
      );
    } finally {
      setDeletingAddressId("");
    }
  }

  const navigationItems = [
    { id: "profile", label: "My Profile", icon: UserRound },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "addresses", label: "My Addresses", icon: MapPin },
    { id: "security", label: "Account Security", icon: ShieldCheck },
  ];

  return (
    <div className="account-page">
      <style>{`
        .account-orders-list { display:grid; gap:16px; }
        .account-order-card { padding:20px; border:1px solid #e8e4dc; border-radius:8px; background:#fff; }
        .account-order-top,.account-order-bottom { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
        .account-order-top { padding-bottom:14px; border-bottom:1px solid #eeeae3; }
        .account-order-number { margin:0 0 5px; font-size:14px; font-weight:700; overflow-wrap:anywhere; }
        .account-order-date,.account-order-meta { color:#77766f; font-size:12px; }
        .account-order-status { padding:7px 11px; border-radius:20px; background:#f0eee8; color:#514a3d; font-size:11px; font-weight:700; }
        .account-order-items { display:grid; gap:12px; padding:16px 0; }
        .account-order-item { display:flex; align-items:center; gap:12px; min-width:0; }
        .account-order-item img,.account-order-placeholder { width:55px; height:62px; flex:0 0 55px; object-fit:cover; background:#f0eee8; }
        .account-order-placeholder { display:grid; place-items:center; color:#8b806e; }
        .account-order-item-info { flex:1; min-width:0; }
        .account-order-item-info strong { display:block; font-size:13px; overflow-wrap:anywhere; }
        .account-order-item-info span { display:block; margin-top:5px; color:#77766f; font-size:12px; }
        .account-order-item-price { font-size:13px; font-weight:600; white-space:nowrap; }
        .account-order-bottom { padding-top:14px; border-top:1px solid #eeeae3; }
        .account-order-total span { display:block; margin-bottom:5px; color:#77766f; font-size:11px; }
        .account-order-total strong { font-size:17px; }
        .account-order-cancel,.account-orders-refresh,.account-orders-pagination button { padding:9px 12px; border:1px solid #dedbd3; background:#fff; cursor:pointer; }
        .account-order-cancel { display:inline-flex; align-items:center; gap:6px; color:#a33b32; border-color:#c9a6a1; font-size:12px; }
        .account-order-cancel:disabled,.account-orders-pagination button:disabled { opacity:.5; cursor:not-allowed; }
        .account-orders-toolbar,.account-orders-pagination { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 0 16px; color:#77766f; font-size:12px; }
        .account-orders-refresh { display:inline-flex; align-items:center; gap:6px; }
        .account-orders-pagination { justify-content:center; margin:20px 0 0; }
        .account-orders-message { padding:12px; background:#f1efe9; color:#514a3d; font-size:13px; }
        .account-orders-error { padding:15px; background:#fff3f1; color:#a33b32; font-size:13px; line-height:1.7; }
        .account-orders-error button { display:block; margin-top:10px; padding:8px 12px; border:1px solid #c9a6a1; background:#fff; cursor:pointer; }
        .account-profile-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .account-profile-field { display:grid; gap:8px; }
        .account-profile-field label { font-size:12px; color:#77766f; }
        .account-profile-field input { width:100%; box-sizing:border-box; padding:13px; border:1px solid #dedbd3; background:#fff; color:#222; font:inherit; }
        .account-profile-field input:disabled { background:#f5f4f1; color:#777; cursor:not-allowed; }
        .account-profile-actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:22px; }
        .account-profile-actions button { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 18px; border:1px solid #222; cursor:pointer; }
        .account-profile-save { background:#111827; color:#fff; }
        .account-profile-cancel { background:#fff; color:#222; }
        .account-profile-actions button:disabled { opacity:.6; cursor:not-allowed; }
        .account-profile-feedback { margin:15px 0; padding:12px 14px; font-size:13px; line-height:1.6; }
        .account-profile-feedback.error { background:#fff3f1; color:#a33b32; }
        .account-profile-feedback.success { background:#edf7ed; color:#276738; }

        .account-address-toolbar { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
        .account-address-add { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 16px; border:1px solid #111827; background:#111827; color:#fff; cursor:pointer; font-size:12px; font-weight:700; }
        .account-address-add:disabled { opacity:.5; cursor:not-allowed; }
        .account-address-list { display:grid; gap:16px; }
        .account-address-card { padding:20px; border:1px solid #e8e4dc; border-radius:8px; background:#fff; }
        .account-address-card.default { border-color:#a58b54; }
        .account-address-card-top { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
        .account-address-default { display:inline-flex; align-items:center; gap:6px; color:#80652f; font-size:11px; font-weight:700; text-transform:uppercase; }
        .account-address-name { margin:0 0 7px; font-size:15px; font-weight:700; }
        .account-address-details { margin:0; color:#77766f; font-size:13px; line-height:1.8; overflow-wrap:anywhere; }
        .account-address-actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:17px; padding-top:14px; border-top:1px solid #eeeae3; }
        .account-address-actions button { display:inline-flex; align-items:center; gap:6px; padding:9px 11px; border:1px solid #dedbd3; background:#fff; color:#333; cursor:pointer; font-size:11px; }
        .account-address-actions button:disabled { opacity:.5; cursor:not-allowed; }
        .account-address-actions .delete { color:#a33b32; border-color:#c9a6a1; }
        .account-address-form { display:grid; gap:16px; padding:20px; margin-bottom:20px; border:1px solid #e8e4dc; border-radius:8px; background:#fff; }
        .account-address-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px; }
        .account-address-field { display:grid; gap:8px; }
        .account-address-field.full { grid-column:1/-1; }
        .account-address-field label { color:#77766f; font-size:12px; }
        .account-address-field input,.account-address-field select,.account-address-field textarea { width:100%; box-sizing:border-box; padding:12px; border:1px solid #dedbd3; background:#fff; color:#222; font:inherit; font-size:13px; }
        .account-address-field textarea { min-height:85px; resize:vertical; }
        .account-address-default-check { display:flex; align-items:center; gap:9px; font-size:13px; color:#514a3d; }
        .account-address-default-check input { width:16px; height:16px; }
        .account-address-feedback { padding:12px 14px; margin:12px 0; font-size:13px; line-height:1.6; }
        .account-address-feedback.error { background:#fff3f1; color:#a33b32; }
        .account-address-feedback.success { background:#edf7ed; color:#276738; }
        @media(max-width:520px) {
          .account-order-card { padding:15px; }
          .account-order-bottom { align-items:flex-start; flex-direction:column; }
          .account-orders-toolbar { align-items:flex-start; flex-direction:column; }
          .account-profile-grid { grid-template-columns:1fr; }
          .account-address-card { padding:15px; }
          .account-address-form { padding:15px; }
          .account-address-form-grid { grid-template-columns:1fr; }
          .account-address-field.full { grid-column:auto; }
        }
      `}</style>

      <header className="account-topbar">
        <Link to="/" className="account-brand">JBELLS</Link>
        <Link to="/" className="account-store-link">
          Continue Shopping <ChevronRight size={16} />
        </Link>
      </header>

      <main className="account-container">
        <div className="account-heading">
          <div>
            <p className="account-eyebrow">YOUR PERSONAL SPACE</p>
            <h1>My Account</h1>
            <p>Welcome back, {fullName}.</p>
          </div>

          <button
            type="button"
            className="account-mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle account navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div className="account-layout">
          <aside className={`account-sidebar ${menuOpen ? "account-sidebar-open" : ""}`}>
            <div className="account-user-card">
              <div className="account-avatar"><UserRound size={27} /></div>
              <div>
                <strong>{fullName}</strong>
                <span>{user.email || "Customer account"}</span>
              </div>
            </div>

            <nav className="account-navigation">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={activeTab === item.id ? "account-nav-item active" : "account-nav-item"}
                    onClick={() => selectTab(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    <ChevronRight size={15} />
                  </button>
                );
              })}
            </nav>

            <button type="button" className="account-logout" onClick={handleLogout}>
              <LogOut size={18} /> Sign Out
            </button>
          </aside>

          <section className="account-content">
            {activeTab === "profile" && (
              <div>
                <div className="account-section-heading">
                  <p className="account-eyebrow">PERSONAL INFORMATION</p>
                  <h2>My Profile</h2>
                  <p>Manage your personal account information.</p>
                </div>

                {profileLoading ? (
                  <div className="account-empty-state">
                    <RefreshCw size={30} />
                    <h3>Loading your profile...</h3>
                  </div>
                ) : (
                  <>
                    {profileError && (
                      <p className="account-profile-feedback error" role="alert">
                        {profileError}
                      </p>
                    )}

                    {profileMessage && (
                      <p className="account-profile-feedback success" role="status">
                        {profileMessage}
                      </p>
                    )}

                    {!editingProfile ? (
                      <>
                        <div className="account-information-grid">
                          <div className="account-information-card">
                            <span>First Name</span>
                            <strong>{user.firstName || "Not provided"}</strong>
                          </div>

                          <div className="account-information-card">
                            <span>Last Name</span>
                            <strong>{user.lastName || "Not provided"}</strong>
                          </div>

                          <div className="account-information-card">
                            <span>Email Address</span>
                            <strong>{user.email || "Not provided"}</strong>
                          </div>

                          <div className="account-information-card">
                            <span>Phone Number</span>
                            <strong>{user.phone || "Not provided"}</strong>
                          </div>
                        </div>

                        <div className="account-profile-actions">
                          <button
                            type="button"
                            className="account-profile-save"
                            onClick={startEditingProfile}
                          >
                            <Pencil size={16} /> EDIT PROFILE
                          </button>
                        </div>
                      </>
                    ) : (
                      <form onSubmit={saveProfile}>
                        <div className="account-profile-grid">
                          <div className="account-profile-field">
                            <label htmlFor="profile-first-name">First Name</label>
                            <input
                              id="profile-first-name"
                              name="firstName"
                              type="text"
                              value={profileForm.firstName}
                              onChange={handleProfileChange}
                              maxLength={50}
                              autoComplete="given-name"
                              required
                            />
                          </div>

                          <div className="account-profile-field">
                            <label htmlFor="profile-last-name">Last Name</label>
                            <input
                              id="profile-last-name"
                              name="lastName"
                              type="text"
                              value={profileForm.lastName}
                              onChange={handleProfileChange}
                              maxLength={50}
                              autoComplete="family-name"
                              required
                            />
                          </div>

                          <div className="account-profile-field">
                            <label htmlFor="profile-email">Email Address</label>
                            <input
                              id="profile-email"
                              type="email"
                              value={user.email || ""}
                              disabled
                              readOnly
                            />
                          </div>

                          <div className="account-profile-field">
                            <label htmlFor="profile-phone">Phone Number</label>
                            <input
                              id="profile-phone"
                              name="phone"
                              type="tel"
                              value={profileForm.phone}
                              onChange={handleProfileChange}
                              maxLength={25}
                              autoComplete="tel"
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>

                        <div className="account-profile-actions">
                          <button
                            type="submit"
                            className="account-profile-save"
                            disabled={savingProfile}
                          >
                            <Save size={16} />
                            {savingProfile ? "SAVING..." : "SAVE CHANGES"}
                          </button>

                          <button
                            type="button"
                            className="account-profile-cancel"
                            onClick={cancelEditingProfile}
                            disabled={savingProfile}
                          >
                            CANCEL
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <div className="account-section-heading">
                  <p className="account-eyebrow">PURCHASE HISTORY</p>
                  <h2>My Orders</h2>
                  <p>Keep track of your JBELLS purchases.</p>
                </div>

                {orderMessage && (
                  <p className="account-orders-message" role="status">{orderMessage}</p>
                )}

                {ordersLoading ? (
                  <div className="account-empty-state">
                    <RefreshCw size={32} />
                    <h3>Loading your orders...</h3>
                    <p>Please wait while we retrieve your purchase history.</p>
                  </div>
                ) : ordersError ? (
                  <div className="account-orders-error" role="alert">
                    {ordersError}
                    <button type="button" onClick={() => fetchOrders(currentPage)}>
                      Try Again
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="account-empty-state">
                    <Package size={42} />
                    <h3>No orders yet</h3>
                    <p>Your purchases will appear here when you place your first order.</p>
                    <Link to="/shop" className="account-primary-button">Start Shopping</Link>
                  </div>
                ) : (
                  <>
                    <div className="account-orders-toolbar">
                      <span>{totalOrders} {totalOrders === 1 ? "order" : "orders"} found</span>
                      <button
                        type="button"
                        className="account-orders-refresh"
                        onClick={() => fetchOrders(currentPage)}
                      >
                        <RefreshCw size={14} /> Refresh
                      </button>
                    </div>

                    <div className="account-orders-list">
                      {orders.map((order) => {
                        const canCancel = ["pending", "confirmed"].includes(
                          String(order.orderStatus || "").toLowerCase()
                        );

                        return (
                          <article className="account-order-card" key={order._id}>
                            <div className="account-order-top">
                              <div>
                                <p className="account-order-number">
                                  {order.orderNumber || "Order reference unavailable"}
                                </p>
                                <span className="account-order-date">
                                  Placed {dateLabel(order.createdAt)}
                                </span>
                              </div>
                              <span className="account-order-status">
                                {label(order.orderStatus)}
                              </span>
                            </div>

                            <div className="account-order-items">
                              {(order.items || []).map((item, index) => (
                                <div
                                  className="account-order-item"
                                  key={`${item.variantSku || item.product || "item"}-${index}`}
                                >
                                  {item.productImage ? (
                                    <img
                                      src={item.productImage}
                                      alt={item.productName || "Ordered product"}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="account-order-placeholder">
                                      <Package size={22} />
                                    </div>
                                  )}

                                  <div className="account-order-item-info">
                                    <strong>{item.productName || "JBELLS product"}</strong>
                                    <span>
                                      Qty: {item.quantity || 0}
                                      {item.size ? ` · Size: ${item.size}` : ""}
                                      {item.color ? ` · Colour: ${item.color}` : ""}
                                    </span>
                                  </div>

                                  <span className="account-order-item-price">
                                    {money(
                                      item.subtotal ??
                                      Number(item.unitPrice || 0) * Number(item.quantity || 0)
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="account-order-bottom">
                              <div>
                                <p className="account-order-meta">
                                  Payment: {label(order.paymentMethod)} · {label(order.paymentStatus)}
                                </p>
                                <p className="account-order-meta">
                                  Shipping: {money(order.shippingFee)}
                                </p>
                              </div>

                              <div className="account-order-total">
                                <span>Order total</span>
                                <strong>{money(order.totalAmount)}</strong>
                              </div>

                              {canCancel && (
                                <button
                                  type="button"
                                  className="account-order-cancel"
                                  onClick={() => cancelOrder(order)}
                                  disabled={cancellingId === order._id}
                                >
                                  <XCircle size={15} />
                                  {cancellingId === order._id ? "Cancelling..." : "Cancel order"}
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="account-orders-pagination">
                        <button
                          type="button"
                          disabled={currentPage <= 1 || ordersLoading}
                          onClick={() => setCurrentPage((page) => page - 1)}
                        >
                          Previous
                        </button>

                        <span>Page {currentPage} of {totalPages}</span>

                        <button
                          type="button"
                          disabled={currentPage >= totalPages || ordersLoading}
                          onClick={() => setCurrentPage((page) => page + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <div className="account-section-heading">
                  <p className="account-eyebrow">DELIVERY INFORMATION</p>
                  <h2>My Addresses</h2>
                  <p>Save and manage your Nigerian delivery addresses.</p>
                </div>

                {addressError && (
                  <p className="account-address-feedback error" role="alert">
                    {addressError}
                  </p>
                )}

                {addressMessage && (
                  <p className="account-address-feedback success" role="status">
                    {addressMessage}
                  </p>
                )}

                <div className="account-address-toolbar">
                  <span className="account-order-meta">
                    {addresses.length} of 10 saved addresses
                  </span>
                  <button
                    type="button"
                    className="account-address-add"
                    onClick={startAddingAddress}
                    disabled={addresses.length >= 10 || showAddressForm}
                  >
                    <Plus size={16} /> ADD NEW ADDRESS
                  </button>
                </div>

                {showAddressForm && (
                  <form className="account-address-form" onSubmit={saveAddress}>
                    <div>
                      <p className="account-eyebrow">
                        {editingAddressId ? "UPDATE DELIVERY DETAILS" : "NEW DELIVERY ADDRESS"}
                      </p>
                      <h3>{editingAddressId ? "Edit Address" : "Add New Address"}</h3>
                    </div>

                    <div className="account-address-form-grid">
                      <div className="account-address-field">
                        <label htmlFor="address-full-name">Full Name *</label>
                        <input
                          id="address-full-name"
                          name="fullName"
                          value={addressForm.fullName}
                          onChange={handleAddressChange}
                          maxLength={100}
                          autoComplete="name"
                          required
                        />
                      </div>

                      <div className="account-address-field">
                        <label htmlFor="address-phone">Phone Number *</label>
                        <input
                          id="address-phone"
                          name="phone"
                          type="tel"
                          value={addressForm.phone}
                          onChange={handleAddressChange}
                          maxLength={20}
                          autoComplete="tel"
                          required
                        />
                      </div>

                      <div className="account-address-field full">
                        <label htmlFor="address-street">Street Address *</label>
                        <input
                          id="address-street"
                          name="address"
                          value={addressForm.address}
                          onChange={handleAddressChange}
                          maxLength={200}
                          autoComplete="street-address"
                          placeholder="House number, street name, area"
                          required
                        />
                      </div>

                      <div className="account-address-field">
                        <label htmlFor="address-city">City *</label>
                        <input
                          id="address-city"
                          name="city"
                          value={addressForm.city}
                          onChange={handleAddressChange}
                          maxLength={100}
                          autoComplete="address-level2"
                          required
                        />
                      </div>

                      <div className="account-address-field">
                        <label htmlFor="address-state">State / FCT *</label>
                        <select
                          id="address-state"
                          name="state"
                          value={addressForm.state}
                          onChange={handleAddressChange}
                          autoComplete="address-level1"
                          required
                        >
                          <option value="">Select state</option>
                          {nigerianStates.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className="account-address-field">
                        <label htmlFor="address-postal">Postal Code</label>
                        <input
                          id="address-postal"
                          name="postalCode"
                          value={addressForm.postalCode}
                          onChange={handleAddressChange}
                          maxLength={20}
                          autoComplete="postal-code"
                        />
                      </div>

                      <div className="account-address-field full">
                        <label htmlFor="address-instructions">Delivery Instructions (Optional)</label>
                        <textarea
                          id="address-instructions"
                          name="deliveryInstructions"
                          value={addressForm.deliveryInstructions}
                          onChange={handleAddressChange}
                          maxLength={500}
                          placeholder="Landmarks, directions or special delivery instructions"
                        />
                      </div>
                    </div>

                    <label className="account-address-default-check">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={addressForm.isDefault}
                        onChange={handleAddressChange}
                      />
                      Set as my default delivery address
                    </label>

                    <div className="account-profile-actions">
                      <button type="submit" className="account-profile-save" disabled={addressSaving}>
                        <Save size={16} />
                        {addressSaving ? "SAVING..." : "SAVE ADDRESS"}
                      </button>
                      <button
                        type="button"
                        className="account-profile-cancel"
                        onClick={cancelAddressForm}
                        disabled={addressSaving}
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                )}

                {addressesLoading ? (
                  <div className="account-empty-state">
                    <RefreshCw size={30} />
                    <h3>Loading your saved addresses...</h3>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="account-empty-state">
                    <MapPin size={42} />
                    <h3>No saved addresses yet</h3>
                    <p>Add your first delivery address to make future JBELLS purchases easier.</p>
                    {!showAddressForm && (
                      <button type="button" className="account-primary-button" onClick={startAddingAddress}>
                        Add Your First Address
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="account-address-list">
                    {addresses.map((address) => (
                      <article
                        className={`account-address-card ${address.isDefault ? "default" : ""}`}
                        key={address._id}
                      >
                        <div className="account-address-card-top">
                          <h3 className="account-address-name">{address.fullName}</h3>
                          {address.isDefault && (
                            <span className="account-address-default">
                              <Star size={14} /> Default Address
                            </span>
                          )}
                        </div>

                        <p className="account-address-details">
                          {address.address}<br />
                          {address.city}, {address.state}
                          {address.postalCode ? `, ${address.postalCode}` : ""}
                          <br />
                          {address.phone}
                          {address.deliveryInstructions && (
                            <>
                              <br />
                              Delivery instructions: {address.deliveryInstructions}
                            </>
                          )}
                        </p>

                        <div className="account-address-actions">
                          <button type="button" onClick={() => startEditingAddress(address)}>
                            <Pencil size={14} /> EDIT
                          </button>
                          {!address.isDefault && (
                            <button type="button" onClick={() => makeDefaultAddress(address._id)}>
                              <Star size={14} /> SET AS DEFAULT
                            </button>
                          )}
                          <button
                            type="button"
                            className="delete"
                            onClick={() => deleteAddress(address)}
                            disabled={deletingAddressId === address._id}
                          >
                            <Trash2 size={14} />
                            {deletingAddressId === address._id ? "DELETING..." : "DELETE"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <div className="account-section-heading">
                  <p className="account-eyebrow">PROTECT YOUR ACCOUNT</p>
                  <h2>Account Security</h2>
                  <p>Manage your password and account protection.</p>
                </div>

                <div className="account-security-card">
                  <div className="account-security-icon">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3>Password Management</h3>
                    <p>
                      Keep your account secure by using a strong, unique password.
                    </p>
                    <Link to="/forgot-password">
                      Reset Password <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="account-footer">
        <p>© {new Date().getFullYear()} JBELLS. All rights reserved.</p>
        <Link to="/">Return to Store</Link>
      </footer>
    </div>
  );
}

export default Account;
