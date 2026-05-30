import { Navigate } from "react-router-dom";

const AuthGuard = ({ children, role }) => {
  const token     = localStorage.getItem("token");
  const savedRole = localStorage.getItem("role");

  // ── Not logged in → login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ── Wrong role → redirect to own dashboard
  if (role && savedRole !== role) {
    return savedRole === "admin"
      ? <Navigate to="/hr-dashboard" replace />
      : <Navigate to="/employee/dashboard" replace />;
  }

  return children;
};

export default AuthGuard;
