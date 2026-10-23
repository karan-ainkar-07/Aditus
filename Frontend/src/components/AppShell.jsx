import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import ThemeToggle from "./ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { buildContexts, setLastContext } from "../lib/contexts.js";

export default function AppShell() {
  const { session, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const contexts = buildContexts(session);
  const current = contexts.find(
    (c) => pathname === c.path || pathname.startsWith(`${c.path}/`)
  );

  useEffect(() => {
    if (current && session?.user?.id) {
      setLastContext(session.user.id, current.key);
    }
  }, [current?.key, session?.user?.id]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-[15px] font-semibold tracking-tight">
              Aditus
            </span>
            {current && (
              <span className="truncate text-sm text-muted">
                {current.clinicName
                  ? `${current.label} · ${current.clinicName}`
                  : current.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {contexts.length > 1 && (
              <button
                type="button"
                onClick={() => navigate("/app", { state: { pick: true } })}
                className="h-9 rounded-full border border-line bg-surface px-3.5 text-sm text-muted transition hover:text-fg"
              >
                Switch
              </button>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="h-9 rounded-full border border-line bg-surface px-3.5 text-sm text-muted transition hover:text-fg"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <Outlet />
      </main>
    </div>
  );
}