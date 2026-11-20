
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../App.css";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";
import API from "../api/api";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

function formatPrice(price) {
  return `₦${Number(price || 0).toLocaleString("en-NG")}`;
}

function getSavedCustomer() {
  try {
    return JSON.parse(sessionStorage.getItem("jbells-user") || "{}");
  } catch {
    return {};
  }
}

function Checkout() {
  const navigate = useNavigate();

  const {
    cart,
    cartCount,
    cartSubtotal,
    cartLoading,
    cartError,
    refreshCart,
  } = useCart();

  const savedCustomer = getSavedCustomer();

  const [formData, setFormData] = useState({
    fullName: `${savedCustomer.firstName || ""} ${savedCustomer.lastName || ""}`.trim(),
    phone: savedCustomer.phone || "",
    email: savedCustomer.email || "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    deliveryInstructions: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (cart.length === 0) {
      setError("Your shopping cart is empty.");
      return;
    }

    if (!formData.state) {
      setError("Please select your delivery state.");
      return;
    }

    setSubmitting(true);

    try {
      const shippingAddress = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
        country: "Nigeria",
        postalCode: formData.postalCode.trim(),
        deliveryInstructions: formData.deliveryInstructions.trim(),
      };

      const response = await API.post("/orders", {
        shippingAddress,
        paymentMethod: "pay_on_delivery",
      });

      const createdOrder = response.data?.order;

      if (!createdOrder) {
        throw new Error(
          "Your order response could not be confirmed. Please check your orders before trying again."
        );
      }

      // The backend empties the cart after successfully creating an order.
      // Refresh the frontend cart without making order success depend on it.
      try {
        await refreshCart();
      } catch (refreshError) {
        console.error("Cart refresh after checkout failed:", refreshError);
      }

      const orderReference =
        createdOrder._id || createdOrder.orderNumber;

      navigate(`/order-success/${encodeURIComponent(orderReference)}`, {
        replace: true,
        state: {
          order: createdOrder,
        },
      });
    } catch (requestError) {
      console.error("Checkout error:", requestError);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (cartLoading) {
    return (
      <div className="store">
        <div className="announcement">
          DISCOVER YOUR STYLE WITH JBELLS
        </div>
        <Navbar cartCount={cartCount} />

        <main className="shop-section">
          <p className="empty-products">Loading your cart...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="store">
      <div className="announcement">
        DISCOVER YOUR STYLE WITH JBELLS
      </div>

      <Navbar cartCount={cartCount} />

      <main>
        <section className="shop-section" style={{ minHeight: "65vh" }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">COMPLETE YOUR PURCHASE</span>
              <h1>Checkout</h1>
            </div>

            <p>Provide your delivery details to place your order.</p>
          </div>

          {cartError && (
            <p role="alert" className="empty-products">
              {cartError}
            </p>
          )}

          {error && (
            <div
              role="alert"
              style={{
                padding: "15px",
                marginBottom: "20px",
                background: "#fff0ee",
                color: "#a33b32",
                border: "1px solid #edc7c2",
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}

          {cart.length === 0 ? (
            <div
              className="empty-products"
              style={{ padding: "45px 20px" }}
            >
              <h2>Your cart is empty</h2>

              <p>
                Add some products to your cart before checking out.
              </p>

              <Link
                to="/shop"
                className="primary-button"
                style={{
                  display: "inline-block",
                  marginTop: "15px",
                  textDecoration: "none",
                }}
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) minmax(270px, 350px)",
                  gap: "30px",
                  alignItems: "start",
                }}
              >
                {/* DELIVERY FORM */}

                <div
                  style={{
                    padding: "25px",
                    background: "#ffffff",
                    border: "1px solid #e7e5df",
                  }}
                >
                  <h2 style={{ marginTop: 0, fontWeight: 500 }}>
                    Delivery Information
                  </h2>

                  <p
                    style={{
                      color: "#77766f",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      marginBottom: "25px",
                    }}
                  >
                    Enter the details of the person receiving this order.
                    JBELLS currently delivers within Nigeria only.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "18px",
                    }}
                  >
                    <div>
                      <label htmlFor="fullName">
                        Full Name *
                      </label>

                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        maxLength={100}
                        placeholder="Enter your full name"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone">
                        Phone Number *
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        maxLength={25}
                        placeholder="Enter your phone number"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="email">
                        Email Address *
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        maxLength={254}
                        placeholder="Enter your email address"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="address">
                        Street Address *
                      </label>

                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        maxLength={300}
                        rows={3}
                        placeholder="House number, street name and area"
                        style={{
                          ...fieldStyle,
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div>
                      <label htmlFor="city">
                        City or Town *
                      </label>

                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        maxLength={100}
                        placeholder="Enter your city"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="state">
                        State *
                      </label>

                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        style={fieldStyle}
                      >
                        <option value="">
                          Select your state
                        </option>

                        {NIGERIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="postalCode">
                        Postal Code (Optional)
                      </label>

                      <input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        value={formData.postalCode}
                        onChange={handleChange}
                        maxLength={20}
                        placeholder="Enter postal code"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryInstructions">
                        Delivery Instructions (Optional)
                      </label>

                      <textarea
                        id="deliveryInstructions"
                        name="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={handleChange}
                        maxLength={500}
                        rows={3}
                        placeholder="Any additional directions for delivery?"
                        style={{
                          ...fieldStyle,
                          resize: "vertical",
                        }}
                      />
                    </div>
                  </div>

                  {/* PAYMENT METHOD */}

                  <div
                    style={{
                      marginTop: "30px",
                      padding: "20px",
                      background: "#f8f6f0",
                      border: "1px solid #e8dfc9",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        fontWeight: 500,
                      }}
                    >
                      Payment Method
                    </h3>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "default",
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="pay_on_delivery"
                        checked
                        readOnly
                      />

                      <span>
                        <strong>Pay on Delivery</strong>
                        <br />

                        <small
                          style={{
                            color: "#77766f",
                            lineHeight: 1.6,
                          }}
                        >
                          Pay when your order is delivered.
                        </small>
                      </span>
                    </label>
                  </div>

                  <p
                    style={{
                      marginTop: "20px",
                      fontSize: "12px",
                      color: "#77766f",
                      lineHeight: 1.7,
                    }}
                  >
                    By placing your order, you confirm that your delivery
                    information is correct.
                  </p>
                </div>

                {/* ORDER SUMMARY */}

                <aside
                  style={{
                    padding: "24px",
                    border: "1px solid #e7e5df",
                    background: "#ffffff",
                    position: "sticky",
                    top: "20px",
                  }}
                >
                  <h2
                    style={{
                      marginTop: 0,
                      fontWeight: 500,
                    }}
                  >
                    Your Order
                  </h2>

                  <p
                    style={{
                      color: "#77766f",
                      fontSize: "13px",
                    }}
                  >
                    {cartCount} item(s) in your cart
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "16px",
                      margin: "20px 0",
                    }}
                  >
                    {cart.map((item) => (
                      <div
                        key={item.cartKey}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "55px minmax(0, 1fr)",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: "55px",
                              height: "65px",
                              objectFit: "cover",
                              background: "#f1efe9",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "55px",
                              height: "65px",
                              background: "#f1efe9",
                            }}
                          />
                        )}

                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              margin: "0 0 5px",
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            {item.name}
                          </p>

                          <p
                            style={{
                              margin: "0 0 5px",
                              fontSize: "11px",
                              color: "#77766f",
                            }}
                          >
                            Size: {item.size || "—"} · Colour:{" "}
                            {item.color || "—"}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#77766f",
                            }}
                          >
                            Qty: {item.quantity}
                          </p>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "5px",
                              fontSize: "13px",
                            }}
                          >
                            {formatPrice(
                              Number(item.price) *
                                Number(item.quantity)
                            )}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #e7e5df",
                      paddingTop: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "15px",
                      }}
                    >
                      <span>Subtotal</span>
                      <strong>{formatPrice(cartSubtotal)}</strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "15px",
                      }}
                    >
                      <span>Delivery Fee</span>
                      <span style={{ textAlign: "right" }}>
                        Calculated by state
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#77766f",
                        lineHeight: 1.7,
                      }}
                    >
                      Your final delivery fee and order total will be
                      calculated by JBELLS when you place your order.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || cart.length === 0}
                    style={{
                      width: "100%",
                      padding: "16px",
                      marginTop: "15px",
                      border: 0,
                      background:
                        submitting || cart.length === 0
                          ? "#999999"
                          : "#101d35",
                      color: "#ffffff",
                      cursor:
                        submitting || cart.length === 0
                          ? "not-allowed"
                          : "pointer",
                      letterSpacing: "1px",
                      fontWeight: 600,
                    }}
                  >
                    {submitting
                      ? "PLACING YOUR ORDER..."
                      : "PLACE ORDER"}
                  </button>

                  <Link
                    to="/cart"
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: "16px",
                      color: "#22221f",
                      fontSize: "13px",
                    }}
                  >
                    Return to Cart
                  </Link>
                </aside>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          JBELLS — Men's and Unisex Clothing.
          <br />
          Style. Comfort. Confidence.
        </p>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} JBELLS. All rights reserved.
          </span>

          <Link to="/" style={{ color: "inherit" }}>
            BACK TO HOME ↑
          </Link>
        </div>
      </footer>
    </div>
  );
}

const fieldStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  marginTop: "8px",
  border: "1px solid #d9d7d0",
  background: "#ffffff",
  color: "#22221f",
  fontFamily: "inherit",
  fontSize: "14px",
  outlineColor: "#c9a44c",
};

export default Checkout;
