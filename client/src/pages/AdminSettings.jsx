
import { useCallback, useEffect, useState } from "react";
import {
  Save,
  RefreshCw,
  Store,
  UserRound,
  ShieldCheck,
  Bell,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import API from "../api/api";

const DEFAULT_STORE = {
  storeName: "JBELLS",
  contactEmail: "",
  contactPhone: "",
  businessAddress: "",
  currency: "NGN",
  country: "Nigeria",
  deliveryCountry: "Nigeria",
  paymentMethods: ["pay_on_delivery"],
  notifications: {
    newOrderEmail: true,
    lowStockEmail: true,
    orderStatusEmail: true,
  },
};

const DEFAULT_PROFILE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const initialPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const styles = {
  page: {
    width: "100%",
    color: "#172033",
  },
  heading: {
    marginBottom: 22,
  },
  eyebrow: {
    color: "#a47d43",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 7px",
    fontSize: 26,
    fontWeight: 800,
    color: "#172b4d",
  },
  subtitle: {
    margin: 0,
    color: "#687386",
    fontSize: 14,
    lineHeight: 1.6,
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 20,
  },
  tab: (active) => ({
    border: `1px solid ${active ? "#172b4d" : "#e1e6ed"}`,
    background: active ? "#172b4d" : "#fff",
    color: active ? "#fff" : "#4b5565",
    borderRadius: 9,
    padding: "11px 15px",
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    transition: "all .2s ease",
  }),
  card: {
    background: "#fff",
    border: "1px solid #e6eaf0",
    borderRadius: 13,
    padding: 24,
    marginBottom: 18,
    boxShadow: "0 4px 18px rgba(20,35,60,.04)",
  },
  cardTitle: {
    margin: "0 0 7px",
    fontSize: 19,
    fontWeight: 800,
    color: "#172b4d",
  },
  cardDesc: {
    margin: "0 0 23px",
    color: "#758094",
    fontSize: 13,
    lineHeight: 1.65,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 17,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#394458",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce2ea",
    borderRadius: 8,
    padding: "12px 13px",
    color: "#172033",
    background: "#fff",
    fontSize: 14,
    outlineColor: "#b28a43",
  },
  disabledInput: {
    background: "#f4f5f7",
    color: "#687386",
    cursor: "not-allowed",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical",
    border: "1px solid #dce2ea",
    borderRadius: 8,
    padding: 13,
    color: "#172033",
    font: "inherit",
    fontSize: 14,
    outlineColor: "#b28a43",
  },
  button: {
    border: 0,
    borderRadius: 8,
    padding: "12px 17px",
    background: "#172b4d",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontWeight: 750,
    cursor: "pointer",
    fontSize: 13,
  },
  secondary: {
    border: "1px solid #dce2ea",
    borderRadius: 8,
    padding: "11px 15px",
    background: "#fff",
    color: "#344054",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  notice: (ok) => ({
    padding: "13px 15px",
    borderRadius: 9,
    marginBottom: 17,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: ok ? "#eef8f1" : "#fff2f0",
    border: `1px solid ${ok ? "#ccebd5" : "#f4d1cc"}`,
    color: ok ? "#17643a" : "#a33327",
    fontSize: 13,
    lineHeight: 1.6,
  }),
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "16px 0",
    borderBottom: "1px solid #edf0f4",
  },
  toggle: {
    width: 19,
    height: 19,
    accentColor: "#172b4d",
    cursor: "pointer",
    flexShrink: 0,
  },
  info: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 9,
    background: "#f7f8fa",
    color: "#687386",
    fontSize: 12,
    marginBottom: 20,
  },
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        style={{
          ...styles.input,
          ...(disabled ? styles.disabledInput : {}),
        }}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

function getErrorMessage(error, fallback) {
  if (!error.response) {
    return "Cannot connect to the backend. Check that your server is running on port 5000.";
  }

  if (error.response.status === 401) {
    return "Your login session has expired. Please sign in again.";
  }

  if (error.response.status === 403) {
    return "You do not have administrator permission to access this section.";
  }

  return error.response.data?.message || fallback;
}

export default function AdminSettings() {
  const [section, setSection] = useState("store");

  const [store, setStore] = useState(DEFAULT_STORE);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [password, setPassword] = useState(initialPassword);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [storeLoadError, setStoreLoadError] = useState("");
  const [profileLoadError, setProfileLoadError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setStoreLoadError("");
    setProfileLoadError("");

    // Load the two resources independently.
    const results = await Promise.allSettled([
      API.get("/admin/settings"),
      API.get("/users/me"),
    ]);

    const [settingsResult, profileResult] = results;

    if (settingsResult.status === "fulfilled") {
      const received =
        settingsResult.value.data?.settings || {};

      setStore({
        ...DEFAULT_STORE,
        ...received,
        notifications: {
          ...DEFAULT_STORE.notifications,
          ...(received.notifications || {}),
        },
        paymentMethods: ["pay_on_delivery"],
        currency: "NGN",
        country: "Nigeria",
        deliveryCountry: "Nigeria",
      });
    } else {
      console.error(
        "Store settings loading error:",
        settingsResult.reason
      );

      setStoreLoadError(
        getErrorMessage(
          settingsResult.reason,
          "Unable to load JBELLS store information."
        )
      );
    }

    if (profileResult.status === "fulfilled") {
      const response = profileResult.value.data;

      const user =
        response?.user ||
        response?.profile ||
        response;

      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    } else {
      console.error(
        "Administrator profile loading error:",
        profileResult.reason
      );

      setProfileLoadError(
        getErrorMessage(
          profileResult.reason,
          "Unable to load administrator profile."
        )
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveStore = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await API.put("/admin/settings", {
        storeName: store.storeName,
        contactEmail: store.contactEmail,
        contactPhone: store.contactPhone,
        businessAddress: store.businessAddress,
        notifications: store.notifications,
      });

      if (response.data?.settings) {
        const received = response.data.settings;

        setStore((current) => ({
          ...current,
          ...received,
          notifications: {
            ...current.notifications,
            ...(received.notifications || {}),
          },
        }));
      }

      setMessage({
        ok: true,
        text:
          response.data?.message ||
          "JBELLS store settings saved successfully.",
      });
    } catch (error) {
      console.error("Store settings save error:", error);

      setMessage({
        ok: false,
        text: getErrorMessage(
          error,
          "Could not save store settings."
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await API.put("/users/me", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });

      const updated =
        response.data?.user ||
        response.data?.profile ||
        response.data;

      if (updated && typeof updated === "object") {
        setProfile((current) => ({
          ...current,
          firstName: updated.firstName ?? current.firstName,
          lastName: updated.lastName ?? current.lastName,
          phone: updated.phone ?? current.phone,
        }));
      }

      try {
        const saved = JSON.parse(
          sessionStorage.getItem("jbells-user") || "{}"
        );

        sessionStorage.setItem(
          "jbells-user",
          JSON.stringify({
            ...saved,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
          })
        );
      } catch (storageError) {
        console.warn("Unable to update local profile cache:", storageError);
      }

      setMessage({
        ok: true,
        text:
          response.data?.message ||
          "Administrator profile updated successfully.",
      });
    } catch (error) {
      console.error("Profile update error:", error);

      setMessage({
        ok: false,
        text: getErrorMessage(
          error,
          "Could not update administrator profile."
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (
      !password.currentPassword ||
      !password.newPassword ||
      !password.confirmPassword
    ) {
      setMessage({
        ok: false,
        text: "Please complete all password fields.",
      });
      return;
    }

    if (password.newPassword.length < 8) {
      setMessage({
        ok: false,
        text: "Your new password must contain at least 8 characters.",
      });
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      setMessage({
        ok: false,
        text: "Your new password and confirmation do not match.",
      });
      return;
    }

    if (password.currentPassword === password.newPassword) {
      setMessage({
        ok: false,
        text: "Your new password must be different from your current password.",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await API.put(
        "/users/me/change-password",
        {
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }
      );

      setPassword(initialPassword);

      setMessage({
        ok: true,
        text:
          response.data?.message ||
          "Administrator password changed successfully.",
      });
    } catch (error) {
      console.error("Password change error:", error);

      setMessage({
        ok: false,
        text: getErrorMessage(
          error,
          "Could not change administrator password."
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNotification = (key, checked) => {
    setStore((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: checked,
      },
    }));
  };

  const tabs = [
    { id: "store", label: "Store information", icon: Store },
    { id: "profile", label: "Administrator profile", icon: UserRound },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <main style={styles.page}>
      <header style={styles.heading}>
        <p style={styles.eyebrow}>JBELLS ADMINISTRATION</p>

        <h1 style={styles.title}>Settings</h1>

        <p style={styles.subtitle}>
          Manage your store information, administrator account,
          security and email notification preferences.
        </p>
      </header>

      {message && (
        <div role="status" style={styles.notice(message.ok)}>
          {message.ok ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {!loading && (storeLoadError || profileLoadError) && (
        <div role="alert" style={styles.notice(false)}>
          <AlertCircle size={19} />
          <div>
            <strong>Some settings could not be loaded.</strong>

            {storeLoadError && (
              <p style={{ margin: "5px 0 0" }}>
                Store information: {storeLoadError}
              </p>
            )}

            {profileLoadError && (
              <p style={{ margin: "5px 0 0" }}>
                Administrator profile: {profileLoadError}
              </p>
            )}
          </div>
        </div>
      )}

      <nav style={styles.tabs} aria-label="Settings sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            style={styles.tab(section === id)}
            onClick={() => {
              setSection(id);
              setMessage(null);
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <section style={styles.card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#687386",
              padding: 12,
            }}
          >
            <LoaderCircle className="animate-spin" size={21} />
            Loading your settings...
          </div>
        </section>
      ) : (
        <>
          {section === "store" && (
            <form style={styles.card} onSubmit={saveStore}>
              <h2 style={styles.cardTitle}>Store information</h2>

              <p style={styles.cardDesc}>
                These details represent your business on
                customer-facing communications. Keep your contact
                information accurate.
              </p>

              <div style={styles.grid}>
                <Field
                  label="Store name"
                  value={store.storeName}
                  onChange={(value) =>
                    setStore((current) => ({
                      ...current,
                      storeName: value,
                    }))
                  }
                  placeholder="JBELLS"
                />

                <Field
                  label="Contact email"
                  type="email"
                  value={store.contactEmail}
                  onChange={(value) =>
                    setStore((current) => ({
                      ...current,
                      contactEmail: value,
                    }))
                  }
                  placeholder="support@yourdomain.com"
                />

                <Field
                  label="Contact phone"
                  value={store.contactPhone}
                  onChange={(value) =>
                    setStore((current) => ({
                      ...current,
                      contactPhone: value,
                    }))
                  }
                  placeholder="080..."
                />
              </div>

              <label style={styles.field}>
                <span style={styles.label}>
                  Business address
                </span>

                <textarea
                  style={styles.textarea}
                  value={store.businessAddress}
                  onChange={(event) =>
                    setStore((current) => ({
                      ...current,
                      businessAddress: event.target.value,
                    }))
                  }
                  placeholder="Enter your business address"
                />
              </label>

              <div style={styles.grid}>
                <Field
                  label="Currency"
                  value="NGN — Nigerian Naira"
                  disabled
                />

                <Field
                  label="Delivery country"
                  value="Nigeria only"
                  disabled
                />

                <Field
                  label="Payment method"
                  value="Pay on Delivery"
                  disabled
                />
              </div>

              <div style={styles.info}>
                <MapPin size={17} />
                Your store currently supports delivery within
                Nigeria and Pay on Delivery.
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: saving ? 0.65 : 1,
                }}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save store information"}
              </button>
            </form>
          )}

          {section === "profile" && (
            <form style={styles.card} onSubmit={saveProfile}>
              <h2 style={styles.cardTitle}>
                Administrator profile
              </h2>

              <p style={styles.cardDesc}>
                Update the name and phone number associated with
                your administrator account.
              </p>

              <div style={styles.info}>
                <UserRound size={18} />
                These details belong to your administrator account.
              </div>

              <div style={styles.grid}>
                <Field
                  label="First name"
                  value={profile.firstName}
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      firstName: value,
                    }))
                  }
                />

                <Field
                  label="Last name"
                  value={profile.lastName}
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      lastName: value,
                    }))
                  }
                />

                <Field
                  label="Email address"
                  type="email"
                  value={profile.email}
                  disabled
                />

                <Field
                  label="Phone number"
                  value={profile.phone}
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      phone: value,
                    }))
                  }
                />
              </div>

              <button
                type="submit"
                style={styles.button}
                disabled={saving || Boolean(profileLoadError)}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save administrator profile"}
              </button>
            </form>
          )}

          {section === "security" && (
            <form style={styles.card} onSubmit={changePassword}>
              <h2 style={styles.cardTitle}>
                Security and password
              </h2>

              <p style={styles.cardDesc}>
                Protect your JBELLS administrator account by
                changing your password regularly.
              </p>

              <div style={{ maxWidth: 560 }}>
                <label style={styles.field}>
                  <span style={styles.label}>Current password</span>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...styles.input, paddingRight: 45 }}
                      type={showCurrentPassword ? "text" : "password"}
                      value={password.currentPassword}
                      onChange={(event) =>
                        setPassword((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label="Toggle current password visibility"
                      onClick={() =>
                        setShowCurrentPassword((value) => !value)
                      }
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 10,
                        border: 0,
                        background: "transparent",
                        color: "#687386",
                        cursor: "pointer",
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>New password</span>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...styles.input, paddingRight: 45 }}
                      type={showNewPassword ? "text" : "password"}
                      value={password.newPassword}
                      onChange={(event) =>
                        setPassword((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label="Toggle new password visibility"
                      onClick={() =>
                        setShowNewPassword((value) => !value)
                      }
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 10,
                        border: 0,
                        background: "transparent",
                        color: "#687386",
                        cursor: "pointer",
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Confirm new password</span>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...styles.input, paddingRight: 45 }}
                      type={showConfirmPassword ? "text" : "password"}
                      value={password.confirmPassword}
                      onChange={(event) =>
                        setPassword((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label="Toggle confirmation password visibility"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 10,
                        border: 0,
                        background: "transparent",
                        color: "#687386",
                        cursor: "pointer",
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div style={styles.info}>
                <ShieldCheck size={18} />
                Use at least 8 characters for your new password.
              </div>

              <button
                type="submit"
                style={styles.button}
                disabled={saving}
              >
                <LockKeyhole size={16} />
                {saving ? "Updating..." : "Change password"}
              </button>
            </form>
          )}

          {section === "notifications" && (
            <form style={styles.card} onSubmit={saveStore}>
              <h2 style={styles.cardTitle}>Email notifications</h2>

              <p style={styles.cardDesc}>
                Choose which store activity email notifications
                should be enabled.
              </p>

              {[
                [
                  "newOrderEmail",
                  "New order notifications",
                  "Receive an email when a customer places a new order.",
                ],
                [
                  "lowStockEmail",
                  "Low stock notifications",
                  "Receive an email when inventory needs attention.",
                ],
                [
                  "orderStatusEmail",
                  "Order status notifications",
                  "Enable customer order-status email notifications.",
                ],
              ].map(([key, label, description]) => (
                <label key={key} style={styles.row}>
                  <span>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 14,
                        marginBottom: 5,
                        color: "#26344b",
                      }}
                    >
                      {label}
                    </strong>
                    <small
                      style={{
                        color: "#758094",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {description}
                    </small>
                  </span>

                  <input
                    style={styles.toggle}
                    type="checkbox"
                    checked={Boolean(store.notifications?.[key])}
                    onChange={(event) =>
                      updateNotification(key, event.target.checked)
                    }
                  />
                </label>
              ))}

              <div style={{ marginTop: 22 }}>
                <button
                  type="submit"
                  style={styles.button}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save notification settings"}
                </button>
              </div>
            </form>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              style={styles.secondary}
              onClick={loadSettings}
              disabled={loading || saving}
            >
              <RefreshCw size={15} />
              Reload settings
            </button>
          </div>
        </>
      )}
    </main>
  );
}
