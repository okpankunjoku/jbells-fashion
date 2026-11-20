
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import jbellsLogo from "../assets/jbells-logo.png";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "Please wait while we verify your email address."
  );

  // Reuse the same request during React StrictMode effect replay.
  const verificationRequestRef = useRef(null);

  useEffect(() => {
    let isActive = true;
    let redirectTimer;

    if (!token) {
      setStatus("error");
      setMessage("Verification link is missing or invalid.");
      return () => {
        isActive = false;
      };
    }

    // Avoid duplicate verification requests during StrictMode.
    if (
      !verificationRequestRef.current ||
      verificationRequestRef.current.token !== token
    ) {
      const request = API.post(
        `/auth/verify-email/${encodeURIComponent(token)}`
      )
        .then((response) => ({
          success: response.data?.success === true,
          message:
            response.data?.message ||
            "Your email verification was completed.",
        }))
        .catch((error) => ({
          success: false,
          message:
            error.response?.data?.message ||
            "We could not verify your email address. Please try again.",
        }));

      verificationRequestRef.current = {
        token,
        promise: request,
      };
    }

    verificationRequestRef.current.promise.then((result) => {
      if (!isActive) return;

      if (result.success) {
        setStatus("success");
        setMessage(
          "Your email address has been verified successfully. You can now log in to your JBELLS account."
        );

        // Redirect to login after showing the success message.
        redirectTimer = setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: {
              verificationSuccess: true,
            },
          });
        }, 20000);
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    });

    return () => {
      isActive = false;

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [token, navigate]);

  const goToLogin = () => {
    navigate("/login", {
      replace: true,
      state: {
        verificationSuccess: status === "success",
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#f3f5f8",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "42px 30px",
          textAlign: "center",
          boxShadow: "0 8px 35px rgba(16, 29, 53, 0.08)",
        }}
      >
        <img
          src={jbellsLogo}
          alt="JBELLS"
          style={{
            width: "150px",
            maxHeight: "90px",
            objectFit: "contain",
            marginBottom: "28px",
          }}
        />

        {status === "loading" && (
          <>
            <div
              style={{
                width: "44px",
                height: "44px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#101d35",
                borderRadius: "50%",
                margin: "0 auto 25px",
                animation: "jbells-spin 0.8s linear infinite",
              }}
            />

            <h2 style={{ color: "#101d35", fontSize: "23px" }}>
              Verifying Your Email
            </h2>

            <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
              {message}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "50%",
                background: "#e8f7ee",
                color: "#16834a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "34px",
                fontWeight: "bold",
                margin: "0 auto 22px",
              }}
            >
              ✓
            </div>

            <h2
              style={{
                color: "#101d35",
                fontSize: "25px",
                marginBottom: "14px",
              }}
            >
              Email Verified Successfully!
            </h2>

            <p
              style={{
                color: "#4b5563",
                fontSize: "15px",
                lineHeight: 1.8,
              }}
            >
              {message}
            </p>

            <p style={{ color: "#a17a2e", fontSize: "13px" }}>
              Redirecting you to the login page...
            </p>

            <button
              onClick={goToLogin}
              style={{
                width: "100%",
                padding: "15px",
                marginTop: "15px",
                background: "#101d35",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              CONTINUE TO LOGIN
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "50%",
                background: "#fff0f0",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: "bold",
                margin: "0 auto 22px",
              }}
            >
              !
            </div>

            <h2 style={{ color: "#101d35", fontSize: "23px" }}>
              Verification Unsuccessful
            </h2>

            <p style={{ color: "#6b7280", lineHeight: 1.8 }}>
              {message}
            </p>

            <button
              onClick={goToLogin}
              style={{
                width: "100%",
                padding: "15px",
                marginTop: "20px",
                background: "#101d35",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              GO TO LOGIN
            </button>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes jbells-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default VerifyEmail;
