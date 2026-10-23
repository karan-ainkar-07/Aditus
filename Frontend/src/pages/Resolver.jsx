import { Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { buildContexts, getLastContext } from "../lib/contexts.js";

function SignOut({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-accent hover:underline"
    >
      Sign out
    </button>
  );
}

export default function Resolver() {
  const { session, logout } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();

  const contexts = buildContexts(session);
  const forcePick = Boolean(state?.pick);

  if (contexts.length === 0) {
    return (
      <AuthLayout
        title="No access yet"
        subtitle="Your account doesn't have a role assigned. Contact your clinic administrator."
        footer={<SignOut onClick={logout} />}
      />
    );
  }

  if (!forcePick) {
    if (contexts.length === 1) {
      return <Navigate to={contexts[0].path} replace />;
    }
    const last = getLastContext(session.user.id);
    const match = contexts.find((c) => c.key === last);
    if (match) return <Navigate to={match.path} replace />;
  }

  return (
    <AuthLayout
      title="Continue as"
      subtitle="Choose where you want to go."
      footer={<SignOut onClick={logout} />}
    >
      <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
        {contexts.map((c) => (
          <li key={c.key} className="border-b border-line last:border-b-0">
            <button
              type="button"
              onClick={() => navigate(c.path)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-bg"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-medium">{c.label}</span>
                <span className="block truncate text-sm text-muted">
                  {c.detail}
                </span>
              </span>
              <svg
                width="8"
                height="14"
                viewBox="0 0 8 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-3 shrink-0 text-muted"
              >
                <path d="M1 1l6 6-6 6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </AuthLayout>
  );
}