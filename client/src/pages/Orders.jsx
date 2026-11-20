
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import Navbar from "../components/Navbar.jsx";
import API from "../api/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/orders/my-orders");

        const data = response.data;
        const customerOrders = Array.isArray(data)
          ? data
          : data.orders || [];

        if (!cancelled) {
          setOrders(customerOrders);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your orders. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatPrice = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const statusStyle = (status) => {
    const normalized = String(status || "pending").toLowerCase();

    if (["delivered", "completed"].includes(normalized)) {
      return { background: "#e8f5e9", color: "#237a3b" };
    }

    if (["cancelled", "failed"].includes(normalized)) {
      return { background: "#fdecec", color: "#b42318" };
    }

    return { background: "#fff4df", color: "#946200" };
  };

  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "55px 20px 80px",
          minHeight: "65vh",
        }}
      >
        <div style={{ marginBottom: "35px" }}>
          <p
            style={{
              color: "#b08d57",
              letterSpacing: "3px",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            JBELLS CUSTOMER ACCOUNT
          </p>

          <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
            My Orders
          </h1>

          <p style={{ color: "#666" }}>
            View and keep track of your purchases.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 10px" }}>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div
            style={{
              padding: "20px",
              background: "#fdecec",
              color: "#b42318",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "55px 20px",
              border: "1px solid #e5e5e5",
              borderRadius: "10px",
            }}
          >
            <h2 style={{ marginBottom: "12px" }}>No Orders Yet</h2>

            <p style={{ color: "#666", marginBottom: "25px" }}>
              You have not placed any orders. Explore our collection and
              discover something you love.
            </p>

            <Link
              to="/shop"
              style={{
                display: "inline-block",
                background: "#111827",
                color: "#fff",
                padding: "13px 25px",
                textDecoration: "none",
                borderRadius: "5px",
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {orders.map((order, index) => {
              const orderStatus =
                order.orderStatus || order.status || "Pending";

              const itemCount = (order.items || []).reduce(
                (total, item) => total + Number(item.quantity || 0),
                0
              );

              return (
                <article
                  key={order._id || order.orderNumber || index}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: "10px",
                    padding: "22px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "15px",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <p style={{ color: "#777", fontSize: "13px" }}>
                        ORDER NUMBER
                      </p>

                      <h3 style={{ fontSize: "17px", marginTop: "5px" }}>
                        {order.orderNumber || order._id || "Order"}
                      </h3>

                      <p
                        style={{
                          color: "#777",
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      style={{
                        ...statusStyle(orderStatus),
                        padding: "7px 13px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {String(orderStatus).replace(/_/g, " ")}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "15px",
                      paddingTop: "17px",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <div>
                      <p style={{ color: "#777", fontSize: "13px" }}>
                        ITEMS
                      </p>
                      <strong>
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </strong>
                    </div>

                    <div>
                      <p style={{ color: "#777", fontSize: "13px" }}>
                        PAYMENT
                      </p>
                      <strong>Pay on Delivery</strong>
                    </div>

                    <div>
                      <p style={{ color: "#777", fontSize: "13px" }}>
                        ORDER TOTAL
                      </p>
                      <strong style={{ fontSize: "17px" }}>
                        {formatPrice(order.total)}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "30px" }}>
          <Link
            to="/account"
            style={{
              color: "#111827",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            ← Back to My Account
          </Link>
        </div>
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

export default Orders;
