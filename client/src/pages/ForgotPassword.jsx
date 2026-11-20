
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import logo from "../assets/jbells-logo.png";
import "../App.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We could not process your request. Please try again."
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
        padding: "30px 15px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          padding: "35px",
          boxSizing: "border-box",
          boxShadow: "0 5px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <Link to="/">
            <img
              src={logo}
              alt="JBELLS"
              style={{
                width: "100px",
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
              marginTop: "15px",
              marginBottom: "12px",
              color: "#101d35",
            }}
          >
            {success ? "Check Your Email" : "Reset Your Password"}
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
              ? "Your password reset request has been received. Please check your email for further instructions."
              : "Forgot your password? No worries. Enter the email address associated with your JBELLS account, and we will send you instructions to reset your password."}
          </p>
        </div>

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

        {success ? (
          <div
            role="status"
            style={{
              background: "#f0f5fa",
              borderLeft: "3px solid #d6b66b",
              padding: "18px",
              marginBottom: "22px",
              color: "#374151",
              fontSize: "13px",
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: "#101d35" }}>
              What happens next?
            </strong>

            <p style={{ margin: "8px 0 0" }}>
              If your account is eligible, you will receive an email
              containing a secure password-reset link.
            </p>

            <p style={{ margin: "8px 0 0" }}>
              Please check your inbox and spam folder. For security,
              the reset link expires after 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" style={labelStyle}>
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="email"
              required
              disabled={loading}
              style={{
                ...inputStyle,
                opacity: loading ? 0.7 : 1,
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "25px",
                background: "#101d35",
                color: "#ffffff",
                border: 0,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "1px",
              }}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>
          </form>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
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
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "8px",
  color: "#101d35",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  border: "1px solid #dedbd3",
  outline: "none",
  fontSize: "14px",
  background: "#ffffff",
};

export default ForgotPassword;
