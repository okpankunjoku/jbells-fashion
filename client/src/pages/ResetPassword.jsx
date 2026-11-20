
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import logo from "../assets/jbells-logo.png";
import "../App.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (value) => {
    if (!value) return { label: "", score: 0 };

    let score = 0;

    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 1) return { label: "Weak", score };
    if (score === 2) return { label: "Fair", score };
    if (score === 3) return { label: "Good", score };

    return { label: "Strong", score };
  };

  const strength = getPasswordStrength(password);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!token) {
      setError(
        "This password-reset link is invalid. Please request a new reset link."
      );
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords you entered do not match. Please try again.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        { newPassword: password }
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Unable to reset your password."
        );
      }

      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 20000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "We could not reset your password. Your reset link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5f0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "35px 15px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "490px",
          background: "#ffffff",
          padding: "38px",
          boxSizing: "border-box",
          boxShadow: "0 5px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* BRANDING */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <Link to="/" aria-label="JBELLS homepage">
            <img
              src={logo}
              alt="JBELLS"
              style={{
                width: "105px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Link>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              fontSize: "30px",
              marginTop: "18px",
              marginBottom: "12px",
              color: "#101d35",
            }}
          >
            {success ? "Password Updated" : "Create a New Password"}
          </h1>

          <p
            style={{
              color: "#77766f",
              fontSize: "14px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {success
              ? "Your JBELLS account password has been successfully updated. You can now sign in using your new password."
              : "Choose a new password to secure your JBELLS account. Make sure it is strong and easy for you to remember."}
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {success ? (
          <div>
            <div
              role="status"
              style={{
                background: "#f0f5fa",
                borderLeft: "4px solid #d6b66b",
                padding: "20px",
                marginBottom: "25px",
                color: "#374151",
                fontSize: "14px",
                lineHeight: 1.8,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  color: "#26733a",
                  marginBottom: "10px",
                }}
              >
                ✓
              </div>

              <strong style={{ color: "#101d35" }}>
                Your password has been changed.
              </strong>

              <p style={{ margin: "8px 0 0" }}>
                You can now access your account with your new password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              style={buttonStyle}
            >
              CONTINUE TO LOGIN
            </button>
          </div>
        ) : (
          <>
            {/* ERROR MESSAGE */}
            {error && (
              <div
                role="alert"
                style={{
                  background: "#fff0f0",
                  color: "#b42318",
                  padding: "13px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                {error}
              </div>
            )}

            {!token && (
              <div
                role="alert"
                style={{
                  background: "#fff8e8",
                  color: "#805d20",
                  padding: "13px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                Your reset link is missing or invalid. Please request a new
                password-reset email.
                <p style={{ marginBottom: 0 }}>
                  <Link
                    to="/forgot-password"
                    style={{
                      color: "#101d35",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Request a new reset link
                  </Link>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* NEW PASSWORD */}
              <div>
                <label htmlFor="password" style={labelStyle}>
                  New Password
                </label>

                <div style={passwordWrapperStyle}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={loading}
                    style={passwordInputStyle}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={visibilityButtonStyle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}
                {password && (
                  <div style={{ marginTop: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "7px",
                      }}
                    >
                      <span style={{ color: "#77766f" }}>
                        Password strength
                      </span>

                      <strong style={{ color: "#101d35" }}>
                        {strength.label}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                      }}
                    >
                      {[1, 2, 3, 4].map((item) => (
                        <div
                          key={item}
                          style={{
                            height: "5px",
                            flex: 1,
                            background:
                              strength.score >= item
                                ? strength.score <= 1
                                  ? "#d9534f"
                                  : strength.score === 2
                                  ? "#e6a23c"
                                  : "#3b8d61"
                                : "#e5e5e5",
                            borderRadius: "3px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <p style={hintStyle}>
                  Use at least 8 characters. A combination of uppercase
                  letters, lowercase letters, numbers and symbols is
                  recommended.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}
              <div style={{ marginTop: "23px" }}>
                <label htmlFor="confirmPassword" style={labelStyle}>
                  Confirm New Password
                </label>

                <div style={passwordWrapperStyle}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={loading}
                    style={passwordInputStyle}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    style={visibilityButtonStyle}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {confirmPassword && (
                  <p
                    style={{
                      fontSize: "12px",
                      marginTop: "8px",
                      color:
                        password === confirmPassword ? "#26733a" : "#b42318",
                    }}
                  >
                    {password === confirmPassword
                      ? "Passwords match."
                      : "Passwords do not match."}
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  ...buttonStyle,
                  opacity: loading || !token ? 0.65 : 1,
                  cursor: loading || !token ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
              </button>
            </form>
          </>
        )}

        {/* LOGIN LINK */}
        {!success && (
          <p
            style={{
              textAlign: "center",
              marginTop: "27px",
              marginBottom: 0,
              fontSize: "14px",
            }}
          >
            <Link
              to="/login"
              style={{
                color: "#101d35",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              ← Back to Login
            </Link>
          </p>
        )}

        <div
          style={{
            borderTop: "1px solid #eeeae2",
            marginTop: "30px",
            paddingTop: "18px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#a18a60",
            }}
          >
            JBELLS FASHION &amp; LIFESTYLE
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "9px",
  color: "#101d35",
};

const passwordWrapperStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #dedbd3",
  background: "#ffffff",
};

const passwordInputStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "14px",
  border: 0,
  outline: "none",
  fontSize: "14px",
  background: "transparent",
};

const visibilityButtonStyle = {
  border: 0,
  background: "transparent",
  color: "#a17a2e",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1px",
  padding: "12px",
  cursor: "pointer",
};

const hintStyle = {
  fontSize: "12px",
  lineHeight: 1.7,
  color: "#88857e",
  marginTop: "9px",
  marginBottom: 0,
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  marginTop: "28px",
  background: "#101d35",
  color: "#ffffff",
  border: 0,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "1.2px",
  cursor: "pointer",
};

export default ResetPassword;
