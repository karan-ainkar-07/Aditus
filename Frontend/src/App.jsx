import { Navigate, Route, Routes } from "react-router-dom";

import GuestRoute from "./components/GuestRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import AppShell from "./components/AppShell.jsx";
import ErrorPage from "./components/ErrorPage.jsx";

import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import Resolver from "./pages/Resolver.jsx";
import Stub from "./pages/Stub.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<Resolver />} />

        <Route element={<AppShell />}>
          <Route element={<RoleRoute role="PATIENT" />}>
            <Route
              path="/patient"
              element={<Stub title="Patient home" text="Appointments and records will appear here." />}
            />
          </Route>

          <Route element={<RoleRoute role="SYSTEM_ADMIN" />}>
            <Route
              path="/admin"
              element={<Stub title="System admin" text="Clinic approvals and user management will appear here." />}
            />
          </Route>

          <Route path="/clinic/:clinicId">
            <Route element={<RoleRoute role="CLINIC_ADMIN" />}>
              <Route
                path="admin"
                element={<Stub title="Clinic admin" text="Staff, clinic settings and approval status will appear here." />}
              />
            </Route>
            <Route element={<RoleRoute role="DOCTOR" />}>
              <Route
                path="doctor"
                element={<Stub title="Doctor home" text="Queue and patient visits will appear here." />}
              />
            </Route>
            <Route element={<RoleRoute role="ATTENDANT" />}>
              <Route
                path="attendant"
                element={<Stub title="Attendant home" text="Check-in and walk-in registration will appear here." />}
              />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route
        path="/403"
        element={
          <ErrorPage
            code="403"
            title="Access denied"
            text="You don't have permission to view this page."
          />
        }
      />
      <Route
        path="*"
        element={
          <ErrorPage
            code="404"
            title="Page not found"
            text="The page you're looking for doesn't exist."
          />
        }
      />
    </Routes>
  );
}