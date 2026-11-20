
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API from "../api/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const allowedNextStatuses = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = {
        page,
        limit: 10,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await API.get("/orders", { params });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load orders."
        );
      }

      setOrders(
        Array.isArray(response.data.orders)
          ? response.data.orders
          : []
      );

      setTotalOrders(Number(response.data.totalOrders) || 0);
      setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
    } catch (err) {
      console.error("Admin orders loading error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to retrieve orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const refreshOrders = () => {
    setRefreshing(true);
    loadOrders();
  };

  const openOrderDetails = async (orderId) => {
    setSelectedOrder(null);
    setDetailsLoading(true);
    setError("");

    try {
      const response = await API.get(`/orders/${orderId}`);

      if (!response.data?.success || !response.data?.order) {
        throw new Error("Unable to retrieve order details.");
      }

      setSelectedOrder(response.data.order);
    } catch (err) {
      console.error("Order details error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to retrieve order details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateStatus = async (order, nextStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to change order ${order.orderNumber} to ${statusLabels[nextStatus]}?`
    );

    if (!confirmed) return;

    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      const response = await API.put(
        `/orders/${order._id}/status`,
        { orderStatus: nextStatus }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update order status."
        );
      }

      setSuccess(response.data.message || "Order status updated.");

      if (selectedOrder?._id === order._id) {
        setSelectedOrder(response.data.order);
      }

      await loadOrders();
    } catch (err) {
      console.error("Order status update error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const customerName = [
      order.user?.firstName,
      order.user?.lastName,
      order.shippingAddress?.fullName,
      order.user?.email,
      order.shippingAddress?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchableText = [
      order.orderNumber,
      customerName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase().trim());
  });

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    };

    return icons[status] || Clock;
  };

  const getCustomerName = (order) => {
    return (
      order.shippingAddress?.fullName ||
      `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
      "Customer"
    );
  };

  const getPaymentLabel = (method) => {
    if (method === "pay_on_delivery") return "Pay on Delivery";
    if (method === "paystack") return "Paystack";
    return method || "Not specified";
  };

  const getPaymentClass = (status) => {
    return `admin-order-payment ${status || "pending"}`;
  };

  const getStatusClass = (status) => {
    return `admin-order-status ${status || "pending"}`;
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setDetailsLoading(false);
  };

  return (
    <section className="admin-orders-section">
      <div className="admin-panel admin-orders-toolbar">
        <div>
          <h2>Order Management</h2>
          <p>
            View customer purchases and manage order fulfilment.
          </p>
        </div>

        <button
          type="button"
          className="admin-order-refresh"
          onClick={refreshOrders}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "Refreshing..." : "Refresh Orders"}
        </button>
      </div>

      <div className="admin-order-summary">
        <div className="admin-order-summary-card">
          <Package size={22} />
          <span>Total Orders</span>
          <strong>{totalOrders}</strong>
        </div>

        <div className="admin-order-summary-card">
          <Clock size={22} />
          <span>Current Page</span>
          <strong>{page} / {totalPages}</strong>
        </div>
      </div>

      {error && (
        <div className="admin-data-error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="admin-order-success" role="status">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")}>
            Dismiss
          </button>
        </div>
      )}

      <div className="admin-panel admin-orders-panel">
        <div className="admin-orders-filters">
          <div className="admin-orders-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search order number or customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search orders"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            aria-label="Filter orders by status"
          >
            <option value="">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="admin-orders-message">
            <RefreshCw className="admin-orders-spinner" size={30} />
            <p>Loading customer orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-orders-message">
            <Package size={38} />
            <h3>No orders found</h3>
            <p>
              {search
                ? "No orders match your search."
                : "Customer orders will appear here after purchases are placed."}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table admin-orders-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.orderStatus);

                  return (
                    <tr key={order._id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                      </td>

                      <td>
                        <strong>{getCustomerName(order)}</strong>
                        <small className="admin-order-customer-email">
                          {order.shippingAddress?.email ||
                            order.user?.email ||
                            ""}
                        </small>
                      </td>

                      <td>{formatDate(order.createdAt)}</td>

                      <td>
                        <strong>
                          {formatCurrency(order.totalAmount)}
                        </strong>
                      </td>

                      <td>
                        <span className={getPaymentClass(order.paymentStatus)}>
                          {order.paymentStatus || "pending"}
                        </span>
                        <small className="admin-order-payment-method">
                          {getPaymentLabel(order.paymentMethod)}
                        </small>
                      </td>

                      <td>
                        <span className={getStatusClass(order.orderStatus)}>
                          <StatusIcon size={14} />
                          {statusLabels[order.orderStatus] ||
                            order.orderStatus}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-order-view-button"
                          onClick={() => openOrderDetails(order._id)}
                          aria-label={`View order ${order.orderNumber}`}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-orders-pagination">
          <span>
            Showing {filteredOrders.length} orders on this page
          </span>

          <div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <strong>
              {page} / {totalPages}
            </strong>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages || loading}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {(selectedOrder || detailsLoading) && (
        <div
          className="admin-order-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <section
            className="admin-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-details-title"
          >
            <div className="admin-order-modal-header">
              <div>
                <span>ORDER INFORMATION</span>
                <h2 id="admin-order-details-title">
                  {selectedOrder?.orderNumber || "Order Details"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close order details"
              >
                <X size={21} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="admin-orders-message">
                <RefreshCw className="admin-orders-spinner" size={28} />
                <p>Loading order details...</p>
              </div>
            ) : selectedOrder ? (
              <div className="admin-order-modal-content">
                <div className="admin-order-detail-grid">
                  <div>
                    <span>Customer</span>
                    <strong>{getCustomerName(selectedOrder)}</strong>
                  </div>

                  <div>
                    <span>Order Date</span>
                    <strong>{formatDate(selectedOrder.createdAt)}</strong>
                  </div>

                  <div>
                    <span>Payment Method</span>
                    <strong>
                      {getPaymentLabel(selectedOrder.paymentMethod)}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Status</span>
                    <strong>{selectedOrder.paymentStatus}</strong>
                  </div>
                </div>

                <div className="admin-order-detail-section">
                  <h3>Delivery Address</h3>
                  <p>
                    <strong>
                      {selectedOrder.shippingAddress?.fullName}
                    </strong>
                  </p>
                  <p>{selectedOrder.shippingAddress?.phone}</p>
                  <p>{selectedOrder.shippingAddress?.email}</p>
                  <p>
                    {selectedOrder.shippingAddress?.address},{" "}
                    {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.state},{" "}
                    {selectedOrder.shippingAddress?.country}
                  </p>

                  {selectedOrder.shippingAddress?.postalCode && (
                    <p>
                      Postal code:{" "}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                  )}

                  {selectedOrder.shippingAddress?.deliveryInstructions && (
                    <p>
                      Delivery instructions:{" "}
                      {selectedOrder.shippingAddress.deliveryInstructions}
                    </p>
                  )}
                </div>

                <div className="admin-order-detail-section">
                  <h3>Purchased Products</h3>

                  <div className="admin-order-items">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        className="admin-order-item"
                        key={`${item.variantSku}-${index}`}
                      >
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                          />
                        ) : (
                          <div className="admin-order-item-placeholder">
                            <Package size={22} />
                          </div>
                        )}

                        <div className="admin-order-item-info">
                          <strong>{item.productName}</strong>
                          <span>SKU: {item.variantSku}</span>
                          <span>
                            Size: {item.size || "N/A"} · Colour:{" "}
                            {item.color || "N/A"}
                          </span>
                          <span>Quantity: {item.quantity}</span>
                        </div>

                        <strong>
                          {formatCurrency(item.subtotal)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-order-total-section">
                  <div>
                    <span>Subtotal</span>
                    <strong>
                      {formatCurrency(selectedOrder.subtotal)}
                    </strong>
                  </div>

                  <div>
                    <span>Shipping Fee</span>
                    <strong>
                      {formatCurrency(selectedOrder.shippingFee)}
                    </strong>
                  </div>

                  <div>
                    <span>Discount</span>
                    <strong>
                      {formatCurrency(selectedOrder.discount)}
                    </strong>
                  </div>

                  <div className="admin-order-grand-total">
                    <span>Total Amount</span>
                    <strong>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </strong>
                  </div>
                </div>

                <div className="admin-order-status-control">
                  <label htmlFor="admin-order-status">
                    Update Order Status
                  </label>

                  <select
                    id="admin-order-status"
                    value={selectedOrder.orderStatus}
                    disabled={updatingStatus}
                    onChange={(event) =>
                      updateStatus(selectedOrder, event.target.value)
                    }
                  >
                    <option value={selectedOrder.orderStatus}>
                      {statusLabels[selectedOrder.orderStatus]}
                    </option>

                    {(allowedNextStatuses[selectedOrder.orderStatus] || []).map(
                      (status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      )
                    )}
                  </select>

                  {updatingStatus && (
                    <small>Updating order status...</small>
                  )}

                  <p>
                    Only valid next steps are available. Paid orders cannot
                    be cancelled until refunded.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminOrders;
