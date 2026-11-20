
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import logo from "../assets/jbells-logo.png";
import "../App.css";

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#22221f",
  fontSize: "13px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  border: "1px solid #e7e5df",
  background: "#faf9f6",
  color: "#22221f",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationRequired, setVerificationRequired] =
    useState(false);
  const [resendMessage, setResendMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
    setVerificationRequired(false);
    setResendMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setResendMessage("");
    setVerificationRequired(false);

    try {
      setLoading(true);

      const response = await API.post("/auth/login", formData);

      const { token, user } = response.data;

      if (!token || !user || !user.role) {
        setError(
          "Your login response is incomplete. Please try again."
        );
        return;
      }

      const role = String(user.role).toLowerCase();

      if (!["admin", "customer"].includes(role)) {
        setError("Your account has an unrecognized access role.");
        return;
      }

      // Save authentication information.
      sessionStorage.setItem("jbells-token", token);
      sessionStorage.setItem("jbells-user", JSON.stringify(user));

      // Notify the shared cart system.
      window.dispatchEvent(new Event("jbells-auth-changed"));

      setSuccess("Login successful. Redirecting...");

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/account", { replace: true });
      }

    } catch (err) {
      const responseData = err.response?.data;

      // Handle unverified email.
      if (responseData?.code === "EMAIL_NOT_VERIFIED") {
        setVerificationRequired(true);
        setError(
          "Your email address has not been verified. Please check your inbox or request another verification email."
        );
      } else {
        setError(
          responseData?.message ||
            "Login failed. Please check your details and try again."
        );
      }

      // Remove any previous authentication information.
      sessionStorage.removeItem("jbells-token");
      sessionStorage.removeItem("jbells-user");

    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!formData.email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      setResending(true);
      setResendMessage("");
      setError("");

      const response = await API.post(
        "/auth/resend-verification",
        {
          email: formData.email.trim(),
        }
      );

      setResendMessage(
        response.data.message ||
          "If your account needs verification, a verification email will be sent."
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to resend verification email. Please try again."
      );
    } finally {
      setResending(false);
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          padding: "35px",
          boxShadow: "0 5px 30px rgba(0,0,0,0.06)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
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
              color: "#22221f",
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              color: "#77766f",
              fontSize: "14px",
            }}
          >
            Login to your JBELLS account.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fff0f0",
              color: "#b42318",
              padding: "12px",
              marginBottom: "18px",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              background: "#edf8ef",
              color: "#26733a",
              padding: "12px",
              marginBottom: "18px",
              fontSize: "13px",
            }}
          >
            {success}
          </div>
        )}

        {verificationRequired && (
          <div
            style={{
              background: "#fff9e9",
              border: "1px solid #ead9a8",
              padding: "18px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                color: "#765a18",
                fontSize: "15px",
                margin: "0 0 8px",
              }}
            >
              Email Verification Required
            </h3>

            <p
              style={{
                color: "#765a18",
                fontSize: "13px",
                lineHeight: 1.7,
                margin: "0 0 15px",
              }}
            >
              Please verify your email address before accessing
              your JBELLS account. You can request a new
              verification link below.
            </p>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              style={{
                width: "100%",
                padding: "13px",
                background: "#22221f",
                color: "#ffffff",
                border: 0,
                cursor: resending ? "not-allowed" : "pointer",
                opacity: resending ? 0.7 : 1,
                fontSize: "12px",
                letterSpacing: "1px",
              }}
            >
              {resending
                ? "SENDING EMAIL..."
                : "RESEND VERIFICATION EMAIL"}
            </button>

            {resendMessage && (
              <p
                role="status"
                style={{
                  color: "#26733a",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  margin: "12px 0 0",
                }}
              >
                {resendMessage}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </div>

          <div
            style={{
              textAlign: "right",
              marginTop: "12px",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: "13px",
                color: "#77766f",
                textDecoration: "underline",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              marginTop: "25px",
              background: "#22221f",
              color: "#ffffff",
              border: 0,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontSize: "13px",
              letterSpacing: "1px",
            }}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#77766f",
            marginTop: "25px",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#22221f",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Create Account
          </Link>
        </p>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "12px",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#77766f",
              textDecoration: "none",
            }}
          >
            Return to Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
