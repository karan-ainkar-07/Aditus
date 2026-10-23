import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Splash from "./Splash.jsx";

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}