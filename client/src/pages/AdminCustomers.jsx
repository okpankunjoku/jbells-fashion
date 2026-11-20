
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import API from "../api/api";

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e8e3dc",
    padding: "22px",
    marginBottom: "20px",
  },
  button: {
    border: "1px solid #ded8cf",
    background: "#fff",
    padding: "10px 14px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  primaryButton: {
    border: "none",
    background: "#a7895d",
    color: "#fff",
    padding: "11px 16px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await API.get("/admin/customers", {
        params: {
          page,
          limit: 10,
          search,
          status,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load customers."
        );
      }

      setCustomers(
        Array.isArray(response.data.customers)
          ? response.data.customers
          : []
      );

      setTotalCustomers(Number(response.data.totalCustomers) || 0);
      setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
    } catch (err) {
      console.error("Customer loading error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load customers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  const viewCustomer = async (customerId) => {
    setDetailLoading(true);
    setSelectedCustomer(null);

    try {
      const response = await API.get(`/admin/customers/${customerId}`);

      if (!response.data?.success || !response.data?.customer) {
        throw new Error("Unable to retrieve customer details.");
      }

      setSelectedCustomer(response.data.customer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to retrieve customer details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const changeCustomerStatus = async (customer) => {
    const nextStatus = !customer.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${customer.firstName} ${customer.lastName}?`
    );

    if (!confirmed) return;

    setUpdatingId(customer._id);
    setError("");
    setNotice("");

    try {
      const response = await API.patch(
        `/admin/customers/${customer._id}/status`,
        { isActive: nextStatus }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update customer."
        );
      }

      setNotice(response.data.message || "Customer account updated.");

      if (selectedCustomer?._id === customer._id) {
        setSelectedCustomer((previous) => ({
          ...previous,
          isActive: nextStatus,
        }));
      }

      await loadCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update customer status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div style={styles.card}>
          <Users color="#a7895d" size={25} />
          <p style={{ color: "#777", marginBottom: "6px" }}>
            Total Customers
          </p>
          <h2 style={{ margin: 0 }}>{totalCustomers.toLocaleString("en-NG")}</h2>
        </div>

        <div style={styles.card}>
          <UserCheck color="#278451" size={25} />
          <p style={{ color: "#777", marginBottom: "6px" }}>
            Customers Shown
          </p>
          <h2 style={{ margin: 0 }}>{customers.length}</h2>
        </div>
      </div>

      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 5px" }}>Customer Management</h2>
            <p style={{ color: "#777", margin: 0 }}>
              View and manage registered JBELLS customers.
            </p>
          </div>

          <button
            type="button"
            style={styles.button}
            onClick={loadCustomers}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              border: "1px solid #ded8cf",
              padding: "0 12px",
              flex: "1 1 250px",
              minWidth: 0,
            }}
          >
            <Search size={18} color="#888" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email or phone..."
              style={{
                border: "none",
                outline: "none",
                padding: "12px 0",
                width: "100%",
              }}
            />
          </div>

          <button type="submit" style={styles.primaryButton}>
            Search
          </button>

          <select
            value={status}
            onChange={(event) => handleStatusFilter(event.target.value)}
            style={{
              border: "1px solid #ded8cf",
              padding: "10px",
              background: "#fff",
            }}
          >
            <option value="all">All customers</option>
            <option value="active">Active customers</option>
            <option value="inactive">Inactive customers</option>
          </select>
        </form>

        {notice && (
          <div
            role="status"
            style={{
              background: "#edf8f0",
              color: "#246b3d",
              padding: "12px",
              marginBottom: "15px",
            }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: "#fff0ef",
              color: "#a12c25",
              padding: "12px",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ padding: "30px 0", textAlign: "center", color: "#777" }}>
            Loading customers...
          </p>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "45px 15px" }}>
            <Users size={38} color="#a7895d" />
            <h3>No customers found</h3>
            <p style={{ color: "#777" }}>
              Try another search or change the account-status filter.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "750px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f7f5f1", textAlign: "left" }}>
                    {[
                      "Customer",
                      "Email",
                      "Phone",
                      "Joined",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "14px 12px",
                          fontSize: "12px",
                          color: "#666",
                          borderBottom: "1px solid #e8e3dc",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td style={cellStyle}>
                        <strong>
                          {customer.firstName} {customer.lastName}
                        </strong>
                      </td>
                      <td style={cellStyle}>{customer.email}</td>
                      <td style={cellStyle}>{customer.phone || "—"}</td>
                      <td style={cellStyle}>{formatDate(customer.createdAt)}</td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            background: customer.isActive ? "#e9f7ee" : "#fff0ef",
                            color: customer.isActive ? "#247544" : "#ad3931",
                            padding: "5px 9px",
                            borderRadius: "20px",
                            fontSize: "12px",
                          }}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: "7px" }}>
                          <button
                            type="button"
                            title="View customer"
                            style={styles.button}
                            onClick={() => viewCustomer(customer._id)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            style={styles.button}
                            disabled={updatingId === customer._id}
                            title={
                              customer.isActive
                                ? "Deactivate customer"
                                : "Activate customer"
                            }
                            onClick={() => changeCustomerStatus(customer)}
                          >
                            {customer.isActive ? (
                              <UserX size={16} color="#b33b32" />
                            ) : (
                              <UserCheck size={16} color="#278451" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <span style={{ color: "#777", fontSize: "13px" }}>
                {totalCustomers} customer(s) · Page {page} of {totalPages}
              </span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  style={styles.button}
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  style={styles.button}
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {(detailLoading || selectedCustomer) && (
        <div
          onClick={() => {
            if (!detailLoading) setSelectedCustomer(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: "480px",
              padding: "25px",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
              }}
              aria-label="Close customer details"
              style={{ ...styles.button, position: "absolute", right: 15, top: 15 }}
            >
              <X size={17} />
            </button>

            {detailLoading ? (
              <p>Loading customer details...</p>
            ) : selectedCustomer ? (
              <>
                <h2 style={{ marginTop: 0 }}>Customer Details</h2>
                <h3>
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>

                <p>
                  <Mail size={16} style={iconStyle} />
                  {selectedCustomer.email}
                </p>

                <p>
                  <Phone size={16} style={iconStyle} />
                  {selectedCustomer.phone || "No phone number"}
                </p>

                <p>
                  <CalendarDays size={16} style={iconStyle} />
                  Joined {formatDate(selectedCustomer.createdAt)}
                </p>

                <p>
                  Account status:{" "}
                  <strong>
                    {selectedCustomer.isActive ? "Active" : "Inactive"}
                  </strong>
                </p>

                <button
                  type="button"
                  style={styles.primaryButton}
                  disabled={updatingId === selectedCustomer._id}
                  onClick={() => changeCustomerStatus(selectedCustomer)}
                >
                  {selectedCustomer.isActive
                    ? "Deactivate Account"
                    : "Activate Account"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

const cellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #eee9e2",
  fontSize: "13px",
  color: "#444",
};

const iconStyle = {
  verticalAlign: "middle",
  marginRight: "9px",
  color: "#a7895d",
};

export default AdminCustomers;
