
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Warehouse,
  Package,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  X,
  History,
  Clock,
} from "lucide-react";
import API from "../api/api";

const initialSummary = {
  totalProducts: 0,
  totalVariants: 0,
  totalStockUnits: 0,
  lowStockVariants: 0,
  outOfStockVariants: 0,
  lowStockThreshold: 5,
};

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString();
}

function getAdjustmentLabel(type) {
  const labels = {
    increase: "Stock Increased",
    decrease: "Stock Decreased",
    set: "Stock Set",
  };

  return labels[type] || type || "Adjustment";
}

function AdminInventory() {
  const [summary, setSummary] = useState(initialSummary);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState("increase");
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  // Load inventory summary and product stock.
  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, inventoryResponse] = await Promise.all([
        API.get("/inventory/summary"),
        API.get("/inventory", {
          params: {
            page,
            limit: 20,
            search: search.trim() || undefined,
            stockStatus: stockStatus || undefined,
          },
        }),
      ]);

      if (summaryResponse.data?.success) {
        setSummary({
          ...initialSummary,
          ...summaryResponse.data.summary,
        });
      }

      if (inventoryResponse.data?.success) {
        setProducts(inventoryResponse.data.products || []);
        setTotalPages(inventoryResponse.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Inventory loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load inventory. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, stockStatus]);

  // Load inventory movement history.
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await API.get("/inventory/history", {
        params: {
          page: historyPage,
          limit: 10,
          search: historySearch.trim() || undefined,
        },
      });

      if (response.data?.success) {
        setHistory(response.data.movements || []);
        setHistoryTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Inventory history loading error:", err);

      setHistoryError(
        err.response?.data?.message ||
          "Unable to load inventory movement history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historySearch]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function openAdjustment(product, variant) {
    setSelectedVariant({
      product,
      variant,
    });

    setAdjustmentType("increase");
    setAdjustment("");
    setReason("");
    setSuccess("");
    setError("");
  }

  function closeAdjustment() {
    if (saving) return;

    setSelectedVariant(null);
    setAdjustment("");
    setReason("");
  }

  async function handleStockUpdate(event) {
    event.preventDefault();

    const quantity = Number(adjustment);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Enter a positive whole-number quantity.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for this stock adjustment.");
      return;
    }

    const { product, variant } = selectedVariant;

    setSaving(true);
    setError("");

    try {
      const response = await API.put(
        `/inventory/${product._id}/variants/${variant._id}`,
        {
          adjustment: quantity,
          adjustmentType,
          reason: reason.trim(),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Stock update failed."
        );
      }

      setSuccess(response.data.message);
      setSelectedVariant(null);
      setAdjustment("");
      setReason("");

      // Refresh inventory and movement history.
      await Promise.all([
        loadInventory(),
        loadHistory(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  function getStockStatus(stock) {
    if (stock === 0) return "Out of stock";
    if (stock <= summary.lowStockThreshold) return "Low stock";

    return "In stock";
  }

  return (
    <div className="admin-inventory">
      <div className="admin-inventory-heading">
        <div>
          <h2>Inventory Overview</h2>
          <p>Monitor and manage your JBELLS product stock.</p>
        </div>

        <button
          type="button"
          className="admin-inventory-refresh"
          onClick={() => {
            loadInventory();
            loadHistory();
          }}
          disabled={loading || historyLoading}
        >
          <RefreshCw size={16} />
          {loading || historyLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="admin-inventory-error" role="alert">
          {error}

          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-inventory-success" role="status">
          {success}

          <button type="button" onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* INVENTORY SUMMARY */}
      <div className="admin-inventory-stats">
        <div className="admin-inventory-stat">
          <Package />
          <span>Total Products</span>
          <strong>
            {loading ? "..." : summary.totalProducts}
          </strong>
        </div>

        <div className="admin-inventory-stat">
          <Warehouse />
          <span>Total Stock Units</span>
          <strong>
            {loading ? "..." : summary.totalStockUnits}
          </strong>
        </div>

        <div className="admin-inventory-stat">
          <AlertTriangle />
          <span>Low Stock Variations</span>
          <strong>
            {loading ? "..." : summary.lowStockVariants}
          </strong>
        </div>

        <div className="admin-inventory-stat">
          <XCircle />
          <span>Out of Stock</span>
          <strong>
            {loading ? "..." : summary.outOfStockVariants}
          </strong>
        </div>
      </div>

      {/* CURRENT INVENTORY */}
      <section className="admin-inventory-panel">
        <div className="admin-inventory-toolbar">
          <div className="admin-inventory-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search product name or brand..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={stockStatus}
            onChange={(event) => {
              setStockStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter inventory by stock status"
          >
            <option value="">All stock levels</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        <div className="admin-inventory-table-wrap">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Colour</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading inventory...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                products.flatMap((product) =>
                  (product.variants || []).map((variant) => (
                    <tr key={`${product._id}-${variant._id}`}>
                      <td>{product.name}</td>
                      <td>{variant.sku}</td>
                      <td>{variant.size}</td>
                      <td>{variant.color}</td>
                      <td>{variant.stock}</td>

                      <td>
                        <span
                          className={`admin-stock-status ${
                            variant.stock === 0
                              ? "out"
                              : variant.stock <= summary.lowStockThreshold
                                ? "low"
                                : "in"
                          }`}
                        >
                          {getStockStatus(variant.stock)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-inventory-adjust"
                          onClick={() =>
                            openAdjustment(product, variant)
                          }
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-inventory-pagination">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {/* INVENTORY MOVEMENT HISTORY */}
      <section className="admin-inventory-panel admin-inventory-history">
        <div className="admin-inventory-heading">
          <div>
            <h2>
              <History size={21} />
              Inventory Movement History
            </h2>

            <p>
              Review previous stock adjustments and administrator
              activity.
            </p>
          </div>

          <button
            type="button"
            className="admin-inventory-refresh"
            onClick={loadHistory}
            disabled={historyLoading}
          >
            <RefreshCw size={16} />
            {historyLoading ? "Loading..." : "Refresh History"}
          </button>
        </div>

        <div className="admin-inventory-toolbar">
          <div className="admin-inventory-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search by SKU or adjustment reason..."
              value={historySearch}
              onChange={(event) => {
                setHistorySearch(event.target.value);
                setHistoryPage(1);
              }}
            />
          </div>
        </div>

        {historyError && (
          <div className="admin-inventory-error" role="alert">
            {historyError}

            <button
              type="button"
              onClick={() => setHistoryError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="admin-inventory-table-wrap">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Adjustment</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Quantity Changed</th>
                <th>Reason</th>
                <th>Performed By</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>

            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan="9">
                    Loading movement history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    No inventory movement records found.
                  </td>
                </tr>
              ) : (
                history.map((movement) => (
                  <tr key={movement._id}>
                    <td>
                      {movement.product?.name || "Product unavailable"}
                    </td>

                    <td>{movement.sku || "N/A"}</td>

                    <td>
                      {getAdjustmentLabel(movement.adjustmentType)}
                    </td>

                    <td>{movement.previousStock}</td>

                    <td>{movement.newStock}</td>

                    <td>{movement.quantityChanged}</td>

                    <td>
                      {movement.reason || "No reason provided"}
                    </td>

                    <td>
                      {movement.performedBy
                        ? `${movement.performedBy.firstName || ""} ${
                            movement.performedBy.lastName || ""
                          }`.trim() || "Administrator"
                        : "Unknown"}
                    </td>

                    <td>
                      <span className="admin-inventory-history-date">
                        <Clock size={14} />
                        {formatDate(movement.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-inventory-pagination">
          <button
            type="button"
            disabled={historyPage <= 1 || historyLoading}
            onClick={() =>
              setHistoryPage((current) => current - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {historyPage} of {historyTotalPages}
          </span>

          <button
            type="button"
            disabled={
              historyPage >= historyTotalPages || historyLoading
            }
            onClick={() =>
              setHistoryPage((current) => current + 1)
            }
          >
            Next
          </button>
        </div>
      </section>

      {/* STOCK ADJUSTMENT MODAL */}
      {selectedVariant && (
        <div className="admin-inventory-modal-backdrop">
          <form
            className="admin-inventory-modal"
            onSubmit={handleStockUpdate}
          >
            <div className="admin-inventory-modal-heading">
              <div>
                <h2>Adjust Stock</h2>
                <p>{selectedVariant.product.name}</p>
              </div>

              <button
                type="button"
                onClick={closeAdjustment}
                disabled={saving}
                aria-label="Close stock adjustment"
              >
                <X />
              </button>
            </div>

            <p>
              SKU: <strong>{selectedVariant.variant.sku}</strong>
            </p>

            <p>
              Size: <strong>{selectedVariant.variant.size}</strong>
              {" | "}
              Colour: <strong>{selectedVariant.variant.color}</strong>
            </p>

            <p>
              Current stock:{" "}
              <strong>{selectedVariant.variant.stock}</strong>
            </p>

            <label htmlFor="adjustmentType">
              Adjustment type
            </label>

            <select
              id="adjustmentType"
              value={adjustmentType}
              onChange={(event) =>
                setAdjustmentType(event.target.value)
              }
            >
              <option value="increase">Increase stock</option>
              <option value="decrease">Decrease stock</option>
            </select>

            <label htmlFor="adjustmentQuantity">
              Quantity
            </label>

            <input
              id="adjustmentQuantity"
              type="number"
              min="1"
              step="1"
              value={adjustment}
              onChange={(event) =>
                setAdjustment(event.target.value)
              }
              required
            />

            <label htmlFor="adjustmentReason">
              Reason for adjustment
            </label>

            <textarea
              id="adjustmentReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              placeholder="Explain why the stock is being adjusted..."
              required
            />

            <div className="admin-inventory-modal-actions">
              <button
                type="button"
                onClick={closeAdjustment}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" disabled={saving}>
                {saving ? (
                  "Updating..."
                ) : adjustmentType === "increase" ? (
                  <>
                    <Plus size={16} /> Increase Stock
                  </>
                ) : (
                  <>
                    <Minus size={16} /> Decrease Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
