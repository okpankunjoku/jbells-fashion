
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();

  let token = null;
  let user = null;

  try {
    token = sessionStorage.getItem("jbells-token");
    user = JSON.parse(sessionStorage.getItem("jbells-user"));
  } catch {
    token = null;
    user = null;
  }

  // Require a valid-looking local session.
  if (!token || !user || !user.role) {
    return (
      <Navigate to="/login" replace state={{ from: location }} />
    );
  }

  const userRole = String(user.role).toLowerCase();

  // Customers must have verified their email.
  if (
    userRole === "customer" &&
    user.isEmailVerified !== true
  ) {
    sessionStorage.removeItem("jbells-token");
    sessionStorage.removeItem("jbells-user");

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          verificationRequired: true,
          email: user.email || "",
        }}
      />
    );
  }

  // Enforce permitted roles.
  if (
    allowedRoles.length > 0 &&
    !allowedRoles
      .map((role) => String(role).toLowerCase())
      .includes(userRole)
  ) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
