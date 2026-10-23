import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildContexts } from "../lib/contexts.js";

export default function RoleRoute({ role }) {
  const { session } = useAuth();
  const { clinicId } = useParams();

  const allowed = buildContexts(session).some(
    (c) => c.role === role && (!clinicId || c.clinicId === clinicId)
  );

  return allowed ? <Outlet /> : <Navigate to="/403" replace />;
}