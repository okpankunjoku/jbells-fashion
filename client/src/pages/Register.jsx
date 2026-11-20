
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import logo from "../assets/jbells-logo.png";
import "../App.css";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [resendMessage, setResendMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess(null);
    setResendMessage("");

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/register",
        formData
      );

      setSuccess({
        email: response.data.user?.email || formData.email,
        emailSent: response.data.emailSent === true,
        message: response.data.message,
      });

      // Do not automatically log in.
      // The customer must verify their email first.

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });

      setConfirmPassword("");

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!success?.email) return;

    try {
      setResending(true);
      setResendMessage("");
      setError("");

      const response = await API.post(
        "/auth/resend-verification",
        {
          email: success.email,
        }
      );

      setResendMessage(
        response.data.message ||
          "If your account needs verification, an email will be sent."
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
          maxWidth: "520px",
          background: "#ffffff",
          padding: "35px",
          boxShadow: "0 5px 30px rgba(0,0,0,0.06)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
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
            {success ? "Check Your Email" : "Create Your Account"}
          </h1>

          <p style={{ color: "#77766f", fontSize: "14px" }}>
            {success
              ? "One more step to complete your registration."
              : "Join JBELLS and discover your style."}
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

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "75px",
                height: "75px",
                borderRadius: "50%",
                background: "#edf7ef",
                color: "#247a3d",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "10px auto 25px",
                fontSize: "35px",
              }}
              aria-hidden="true"
            >
              ✉
            </div>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 400,
                color: "#22221f",
                fontSize: "23px",
              }}
            >
              Thank You for Joining JBELLS!
            </h2>

            <p
              style={{
                color: "#66645e",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              Your account has been created successfully.
              We've sent an email verification link to:
            </p>

            <p
              style={{
                color: "#22221f",
                fontWeight: 700,
                fontSize: "15px",
                wordBreak: "break-word",
                margin: "18px 0",
              }}
            >
              {success.email}
            </p>

            {success.emailSent ? (
              <p
                style={{
                  color: "#247a3d",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                Please open your inbox and click the
                verification button to activate your account.
              </p>
            ) : (
              <p
                style={{
                  color: "#b45309",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                Your account was created, but the verification
                email could not be sent. Please try sending it again.
              </p>
            )}

            <div
              style={{
                background: "#f7f5f0",
                padding: "16px",
                margin: "22px 0",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "#44423d",
                  fontWeight: 600,
                  marginTop: 0,
                }}
              >
                Didn't receive the email?
              </p>

              <ul
                style={{
                  paddingLeft: "18px",
                  color: "#77766f",
                  fontSize: "12px",
                  lineHeight: 1.9,
                }}
              >
                <li>Check your spam or junk folder.</li>
                <li>Make sure your email address is correct.</li>
                <li>Try requesting another verification email.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              style={{
                width: "100%",
                padding: "14px",
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
                ? "SENDING..."
                : "RESEND VERIFICATION EMAIL"}
            </button>

            {resendMessage && (
              <p
                role="status"
                style={{
                  color: "#247a3d",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  marginTop: "15px",
                }}
              >
                {resendMessage}
              </p>
            )}

            <p
              style={{
                fontSize: "13px",
                color: "#77766f",
                marginTop: "25px",
              }}
            >
              Already verified?{" "}
              <Link
                to="/login"
                style={{
                  color: "#22221f",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Login to your account
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label htmlFor="firstName" style={labelStyle}>
                    First Name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" style={labelStyle}>
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
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
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: "18px" }}>
                <label htmlFor="password" style={labelStyle}>
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: "18px" }}>
                <label
                  htmlFor="confirmPassword"
                  style={labelStyle}
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={8}
                  required
                  style={inputStyle}
                />
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
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
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
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "#22221f",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Login
              </Link>
            </p>
          </>
        )}

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
            ← Back to JBELLS homepage
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
  color: "#22221f",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  border: "1px solid #dedbd3",
  outline: "none",
  fontSize: "14px",
  background: "#ffffff",
};

export default Register;
