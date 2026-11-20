import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Download,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import API from "../api/api";

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const number = (value) => Number(value || 0).toLocaleString("en-NG");

const dateForInput = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const initialReport = {
  summary: {},
  statusBreakdown: [],
  dailySales: [],
  topProducts: [],
};

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="asr-stat-card">
      <div className="asr-stat-icon"><Icon size={21} /></div>
      <p>{label}</p>
      <h3>{value}</h3>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export default function AdminSalesReports() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(dateForInput(monthStart));
  const [endDate, setEndDate] = useState(dateForInput(today));
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await API.get("/orders/admin/reports", { params });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "The sales report could not be loaded.");
      }

      setReport({
        summary: response.data.summary || {},
        statusBreakdown: Array.isArray(response.data.statusBreakdown)
          ? response.data.statusBreakdown
          : [],
        dailySales: Array.isArray(response.data.dailySales)
          ? response.data.dailySales
          : [],
        topProducts: Array.isArray(response.data.topProducts)
          ? response.data.topProducts
          : [],
      });
    } catch (err) {
      console.error("JBELLS sales report error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load sales reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = report.summary || {};
  const maxDailySales = Math.max(
    1,
    ...report.dailySales.map((item) => Number(item.salesValue || item.totalOrderValue || 0))
  );

  const exportCsv = () => {
    const rows = [
      ["JBELLS Sales Report"],
      ["Start date", startDate || "All time"],
      ["End date", endDate || "All time"],
      [],
      ["Metric", "Value"],
      ["Total orders", summary.totalOrders || 0],
      ["Total order value", summary.totalOrderValue || 0],
      ["Delivered orders", summary.deliveredOrders || 0],
      ["Delivered sales value", summary.deliveredSalesValue || 0],
      ["Collected revenue", summary.collectedRevenue || 0],
      ["Pending orders", summary.pendingOrders || 0],
      ["Pending order value", summary.pendingOrderValue || 0],
      ["Cancelled orders", summary.cancelledOrders || 0],
      [],
      ["Daily date", "Orders", "Order value", "Collected revenue"],
      ...report.dailySales.map((item) => [
        item.date || "",
        item.orders || item.orderCount || 0,
        item.totalOrderValue || item.salesValue || 0,
        item.collectedRevenue || 0,
      ]),
      [],
      ["Top product", "SKU", "Units sold", "Sales value"],
      ...report.topProducts.map((item) => [
        item.productName || item.name || "Product",
        item.variantSku || item.sku || "",
        item.unitsSold || 0,
        item.salesValue || 0,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jbells-sales-report-${startDate || "all"}-to-${endDate || "all"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="asr-page">
      <style>{`
        .asr-page{display:grid;gap:22px;color:#172033}
        .asr-toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:12px;padding:18px;background:#fff;border:1px solid #e8ebf0;border-radius:14px}
        .asr-field{display:grid;gap:6px;min-width:170px}
        .asr-field label{font-size:12px;font-weight:700;color:#596579}
        .asr-field input{min-height:42px;border:1px solid #d9dee7;border-radius:8px;padding:8px 10px;font:inherit;color:#172033}
        .asr-btn{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:0;border-radius:8px;background:#101f3d;color:#fff;font-weight:700;cursor:pointer}
        .asr-btn:disabled{opacity:.6;cursor:wait}
        .asr-btn.secondary{background:#f0f2f6;color:#172033;border:1px solid #e1e5ec}
        .asr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .asr-stat-card,.asr-panel{background:#fff;border:1px solid #e8ebf0;border-radius:14px;padding:18px;min-width:0}
        .asr-stat-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:10px;background:#f0f3f8;color:#15294e;margin-bottom:13px}
        .asr-stat-card p{margin:0;color:#687386;font-size:13px}
        .asr-stat-card h3{font-size:clamp(19px,2vw,25px);margin:7px 0 4px;overflow-wrap:anywhere}
        .asr-stat-card small{color:#7b8493}
        .asr-panels{display:grid;grid-template-columns:1.4fr 1fr;gap:16px}
        .asr-panel h2{font-size:17px;margin:0 0 5px}
        .asr-panel-sub{font-size:12px;color:#788294;margin:0 0 18px}
        .asr-table-wrap{width:100%;overflow-x:auto}
        .asr-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}
        .asr-table th,.asr-table td{padding:12px 10px;border-bottom:1px solid #edf0f4;white-space:nowrap}
        .asr-table th{color:#687386;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
        .asr-empty{padding:25px 8px;text-align:center;color:#7b8493;font-size:13px}
        .asr-bar-row{display:grid;grid-template-columns:90px 1fr auto;align-items:center;gap:10px;margin:13px 0;font-size:12px}
        .asr-bar-track{height:10px;border-radius:20px;background:#edf0f5;overflow:hidden}
        .asr-bar-fill{height:100%;border-radius:20px;background:#243d68}
        .asr-status-row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #edf0f4;font-size:13px}
        .asr-error{padding:14px;border-radius:10px;background:#fff1f0;color:#a32d26;border:1px solid #ffd4d0}
        @media(max-width:1050px){.asr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:700px){.asr-grid,.asr-panels{grid-template-columns:1fr}.asr-toolbar{align-items:stretch}.asr-field{width:100%}.asr-btn{width:100%}.asr-bar-row{grid-template-columns:72px 1fr auto}}
      `}</style>

      <div className="asr-toolbar">
        <div className="asr-field">
          <label htmlFor="asr-start">Start date</label>
          <input id="asr-start" type="date" value={startDate} max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div className="asr-field">
          <label htmlFor="asr-end">End date</label>
          <input id="asr-end" type="date" value={endDate} min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)} />
        </div>
        <button className="asr-btn" type="button" onClick={loadReport} disabled={loading}>
          <RefreshCw size={16} /> {loading ? "Loading..." : "Apply filters"}
        </button>
        <button className="asr-btn secondary" type="button" onClick={exportCsv} disabled={loading}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {error ? (
        <div className="asr-error" role="alert">
          <strong>Sales report could not be loaded.</strong>
          <p>{error}</p>
          <button className="asr-btn" type="button" onClick={loadReport}>Try again</button>
        </div>
      ) : null}

      <div className="asr-grid">
        <StatCard label="Total Orders" value={loading ? "…" : number(summary.totalOrders)}
          detail="Orders created in the selected period" icon={ShoppingBag} />
        <StatCard label="Total Order Value" value={loading ? "…" : money(summary.totalOrderValue)}
          detail="Includes all order statuses" icon={CircleDollarSign} />
        <StatCard label="Delivered Sales" value={loading ? "…" : money(summary.deliveredSalesValue)}
          detail={`${number(summary.deliveredOrders)} delivered orders`} icon={Truck} />
        <StatCard label="Collected Revenue" value={loading ? "…" : money(summary.collectedRevenue)}
          detail="Orders marked as paid" icon={Wallet} />
        <StatCard label="Pending Orders" value={loading ? "…" : number(summary.pendingOrders)}
          detail={money(summary.pendingOrderValue)} icon={ClipboardList} />
        <StatCard label="Cancelled Orders" value={loading ? "…" : number(summary.cancelledOrders)}
          detail={money(summary.cancelledOrderValue)} icon={ShoppingBag} />
        <StatCard label="Average Order Value" value={loading ? "…" : money(summary.averageOrderValue)}
          detail="Excludes cancelled orders" icon={TrendingUp} />
        <StatCard label="Shipping Fees" value={loading ? "…" : money(summary.totalShippingFees)}
          detail="Shipping fees on orders in this period" icon={Package} />
      </div>

      <div className="asr-panels">
        <section className="asr-panel">
          <h2>Daily Sales</h2>
          <p className="asr-panel-sub">Order value by day, excluding cancelled orders</p>
          {loading ? <div className="asr-empty">Loading daily sales…</div> :
            report.dailySales.length === 0 ? <div className="asr-empty">No daily sales data for this period.</div> :
            report.dailySales.map((item, index) => {
              const value = Number(item.salesValue ?? item.totalOrderValue ?? 0);
              return (
                <div className="asr-bar-row" key={item.date || index}>
                  <span>{item.date || "Date"}</span>
                  <div className="asr-bar-track"><div className="asr-bar-fill"
                    style={{ width: `${Math.max(0, Math.min(100, (value / maxDailySales) * 100))}%` }} /></div>
                  <strong>{money(value)}</strong>
                </div>
              );
            })}
        </section>

        <section className="asr-panel">
          <h2>Order Status</h2>
          <p className="asr-panel-sub">Current status breakdown for orders in this period</p>
          {loading ? <div className="asr-empty">Loading order statuses…</div> :
            report.statusBreakdown.length === 0 ? <div className="asr-empty">No order status data available.</div> :
            report.statusBreakdown.map((item, index) => (
              <div className="asr-status-row" key={item.status || item._id || index}>
                <span>{item.status || item._id || "Other"}</span>
                <strong>{number(item.count ?? item.orders)}</strong>
              </div>
            ))}
        </section>
      </div>

      <section className="asr-panel">
        <h2>Top-Selling Products</h2>
        <p className="asr-panel-sub">Ranked by units sold, excluding cancelled orders</p>
        <div className="asr-table-wrap">
          <table className="asr-table">
            <thead><tr><th>Product</th><th>SKU / Variant</th><th>Units Sold</th><th>Sales Value</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="4" className="asr-empty">Loading products…</td></tr> :
                report.topProducts.length === 0 ? <tr><td colSpan="4" className="asr-empty">No product sales found for this period.</td></tr> :
                report.topProducts.map((item, index) => (
                  <tr key={`${item.product || item.productName || index}-${item.variantSku || ""}`}>
                    <td>{item.productName || item.name || "Product"}</td>
                    <td>{item.variantSku || item.sku || "—"}</td>
                    <td>{number(item.unitsSold)}</td>
                    <td>{money(item.salesValue)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
