
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import "../App.css";
import Navbar from "../components/Navbar.jsx";
import API from "../api/api";

function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (order) return;

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/orders/${encodeURIComponent(orderId)}`
        );

        if (!cancelled) {
          setOrder(response.data.order || response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "We could not load your order details. Please check your order history."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, order]);

  const formatPrice = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const items = order?.items || [];
  const shippingAddress = order?.shippingAddress || {};

  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "70px 20px",
          minHeight: "65vh",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 10px" }}>
            <h2>Loading your order...</h2>
            <p>Please wait while we retrieve your order details.</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 10px" }}>
            <h1>Order received</h1>
            <p>{error}</p>
            <Link to="/orders">View My Orders</Link>
          </div>
        ) : (
          <>
            <section
              style={{
                textAlign: "center",
                marginBottom: "45px",
              }}
            >
              <div
                style={{
                  width: "75px",
                  height: "75px",
                  borderRadius: "50%",
                  background: "#e8f5e9",
                  color: "#237a3b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "42px",
                  margin: "0 auto 20px",
                }}
              >
                ✓
              </div>

              <p
                style={{
                  color: "#b08d57",
                  letterSpacing: "3px",
                  fontWeight: "700",
                  fontSize: "13px",
                }}
              >
                JBELLS
              </p>

              <h1 style={{ fontSize: "32px", marginBottom: "12px" }}>
                Thank You for Your Order!
              </h1>

              <p style={{ color: "#666", lineHeight: 1.7 }}>
                Your order has been placed successfully. We will contact you
                with updates about your delivery.
              </p>

              {order?.orderNumber && (
                <p style={{ marginTop: "18px" }}>
                  **Order Number:** {order.orderNumber}
                </p>
              )}
            </section>

            <section
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: "10px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>
                Order Summary
              </h2>

              {items.length > 0 ? (
                items.map((item, index) => (
                  <div
                    key={item._id || item.variantSku || index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "15px",
                      padding: "13px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div>
                      <strong>
                        {item.name || item.product?.name || "Product"}
                      </strong>
                      <p style={{ color: "#777", fontSize: "13px" }}>
                        Quantity: {item.quantity}
                        {item.size ? ` | Size: ${item.size}` : ""}
                        {item.color ? ` | Colour: ${item.color}` : ""}
                      </p>
                    </div>

                    <strong>
                      {formatPrice(
                        item.subtotal ??
                          Number(item.unitPrice || item.price || 0) *
                            Number(item.quantity || 0)
                      )}
                    </strong>
                  </div>
                ))
              ) : (
                <p>Order items are not available on this page.</p>
              )}

              <div style={{ marginTop: "20px", lineHeight: 2 }}>
                <p>
                  Subtotal:{" "}
                  <strong>{formatPrice(order?.subtotal)}</strong>
                </p>
                <p>
                  Delivery:{" "}
                  <strong>
                    {formatPrice(order?.shippingFee ?? order?.deliveryFee)}
                  </strong>
                </p>
                <p>
                  Total:{" "}
                  <strong style={{ fontSize: "20px" }}>
                    {formatPrice(order?.total)}
                  </strong>
                </p>
              </div>
            </section>

            <section
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: "10px",
                padding: "25px",
                marginBottom: "30px",
              }}
            >
              <h2 style={{ fontSize: "20px", marginBottom: "15px" }}>
                Delivery Information
              </h2>

              <p>
                <strong>Recipient:</strong>{" "}
                {shippingAddress.fullName || shippingAddress.name || "—"}
              </p>
              <p>
                <strong>Phone:</strong> {shippingAddress.phone || "—"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {[
                  shippingAddress.address,
                  shippingAddress.city,
                  shippingAddress.state,
                  shippingAddress.postalCode,
                  shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>

              <p>
                <strong>Payment Method:</strong> Pay on Delivery
              </p>
              <p>
                <strong>Order Status:</strong>{" "}
                {order?.orderStatus || order?.status || "Pending"}
              </p>
            </section>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <Link
                to="/orders"
                style={{
                  background: "#111827",
                  color: "#fff",
                  padding: "14px 25px",
                  textDecoration: "none",
                  borderRadius: "5px",
                }}
              >
                View My Orders
              </Link>

              <Link
                to="/shop"
                style={{
                  border: "1px solid #111827",
                  color: "#111827",
                  padding: "14px 25px",
                  textDecoration: "none",
                  borderRadius: "5px",
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </main>

      <footer
        style={{
          background: "#111827",
          color: "#fff",
          textAlign: "center",
          padding: "25px 15px",
        }}
      >
        <p>© {new Date().getFullYear()} JBELLS. All Rights Reserved.</p>
      </footer>
    </>
  );
}

export default OrderSuccess;
