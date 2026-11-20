
import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";

function formatPrice(price) {
  return `₦${Number(price || 0).toLocaleString("en-NG")}`;
}

function Cart() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartLoading,
    cartError,
    updateQuantity,
    removeItem,
  } = useCart();

  const [busyItem, setBusyItem] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function handleQuantityChange(item, quantity) {
    setBusyItem(item.cartKey);
    setActionError("");
    setActionMessage("");

    try {
      await updateQuantity(item, quantity);
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update this item's quantity."
      );
    } finally {
      setBusyItem("");
    }
  }

  async function handleRemove(item) {
    setBusyItem(item.cartKey);
    setActionError("");
    setActionMessage("");

    try {
      await removeItem(item);
      setActionMessage(`${item.name} has been removed from your cart.`);
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Unable to remove this item."
      );
    } finally {
      setBusyItem("");
    }
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
              <span className="eyebrow">YOUR SELECTION</span>
              <h1>Shopping Cart</h1>
            </div>

            <p>Review your selected pieces before continuing.</p>
          </div>

          {cartLoading && (
            <p className="empty-products">Loading your cart...</p>
          )}

          {(cartError || actionError) && (
            <p className="empty-products" role="alert">
              {actionError || cartError}
            </p>
          )}

          {actionMessage && (
            <p role="status" style={{ color: "#52734b", margin: "15px 0" }}>
              {actionMessage}
            </p>
          )}

          {!cartLoading && cart.length === 0 && (
            <div className="empty-products" style={{ padding: "45px 20px" }}>
              <h2>Your cart is empty</h2>

              <p>
                Explore the JBELLS collection and add something you love.
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
          )}

          {!cartLoading && cart.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) minmax(260px, 340px)",
                gap: "30px",
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: "18px" }}>
                {cart.map((item) => {
                  const itemBusy = busyItem === item.cartKey;

                  const lineTotal =
                    Number(item.price || 0) *
                    Number(item.quantity || 0);

                  return (
                    <article
                      key={item.cartKey}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px minmax(0, 1fr)",
                        gap: "18px",
                        padding: "18px",
                        border: "1px solid #e7e5df",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          width: "110px",
                          height: "130px",
                          background: "#f1efe9",
                          overflow: "hidden",
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="empty-products"
                            style={{
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "12px",
                            }}
                          >
                            Image unavailable
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: "0 0 7px",
                                fontWeight: 500,
                              }}
                            >
                              {item.name}
                            </h3>

                            {item.category && (
                              <p
                                style={{
                                  margin: "0 0 7px",
                                  color: "#77766f",
                                  fontSize: "12px",
                                }}
                              >
                                {item.category}
                              </p>
                            )}

                            <p
                              style={{
                                margin: 0,
                                color: "#77766f",
                                fontSize: "13px",
                              }}
                            >
                              Size: {item.size || "—"}
                              <span style={{ margin: "0 6px" }}>·</span>
                              Colour: {item.color || "—"}
                            </p>
                          </div>

                          <strong>{formatPrice(lineTotal)}</strong>
                        </div>

                        <p style={{ margin: "12px 0", fontWeight: 600 }}>
                          {formatPrice(item.price)} each
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              border: "1px solid #e7e5df",
                            }}
                          >
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name} quantity`}
                              disabled={itemBusy || item.quantity <= 1}
                              onClick={() =>
                                handleQuantityChange(
                                  item,
                                  Number(item.quantity) - 1
                                )
                              }
                              style={{
                                width: "38px",
                                height: "38px",
                                border: 0,
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              −
                            </button>

                            <span
                              style={{
                                minWidth: "30px",
                                textAlign: "center",
                              }}
                            >
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Increase ${item.name} quantity`}
                              disabled={
                                itemBusy ||
                                item.quantity >= Number(item.stock || 0)
                              }
                              onClick={() =>
                                handleQuantityChange(
                                  item,
                                  Number(item.quantity) + 1
                                )
                              }
                              style={{
                                width: "38px",
                                height: "38px",
                                border: 0,
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              +
                            </button>
                          </div>

                          <span
                            style={{
                              color: "#77766f",
                              fontSize: "12px",
                            }}
                          >
                            {item.stock} available
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            disabled={itemBusy}
                            style={{
                              border: 0,
                              background: "transparent",
                              color: "#a33b32",
                              textDecoration: "underline",
                              cursor: "pointer",
                              padding: "8px 0",
                            }}
                          >
                            {itemBusy ? "PLEASE WAIT..." : "REMOVE"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside
                style={{
                  padding: "24px",
                  border: "1px solid #e7e5df",
                  background: "#fff",
                }}
              >
                <h2 style={{ marginTop: 0, fontWeight: 500 }}>
                  Order Summary
                </h2>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                    margin: "18px 0",
                  }}
                >
                  <span>Items ({cartCount})</span>
                  <strong>{formatPrice(cartSubtotal)}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e7e5df",
                    fontSize: "17px",
                  }}
                >
                  <strong>Subtotal</strong>
                  <strong>{formatPrice(cartSubtotal)}</strong>
                </div>

                <p
                  style={{
                    color: "#77766f",
                    fontSize: "12px",
                    lineHeight: 1.7,
                    margin: "16px 0 20px",
                  }}
                >
                  Shipping and payment will be calculated during checkout.
                </p>

                <Link
                  to="/checkout"
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "15px",
                    border: 0,
                    background: "#111827",
                    color: "#fff",
                    textAlign: "center",
                    textDecoration: "none",
                    letterSpacing: "1px",
                    fontWeight: 600,
                  }}
                >
                  PROCEED TO CHECKOUT
                </Link>

                <Link
                  to="/shop"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: "16px",
                    color: "#22221f",
                  }}
                >
                  Continue shopping
                </Link>
              </aside>
            </div>
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

export default Cart;
