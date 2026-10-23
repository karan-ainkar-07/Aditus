const BASE = "/api";

// These paths must never trigger a refresh attempt
const NO_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/refresh",
  "/auth/logout",
];

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// One refresh at a time, shared by all concurrent 401s
let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

async function request(path, { method = "GET", body, retry = true } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[api] ${method} ${path} network error`, err);
    }
    throw new ApiError("Cannot reach the server", 0, null);
  }

  if (res.status === 401 && retry && !NO_REFRESH.includes(path)) {
    const refreshed = await refreshSession();
    if (refreshed) return request(path, { method, body, retry: false });
    window.dispatchEvent(new Event("auth:expired"));
  }

  // Read as text first so non-JSON bodies (proxy errors, HTML) aren't lost
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const quiet = res.status === 401 && path === "/auth/me"; // expected on first load
    if (import.meta.env.DEV && !quiet) {
      console.error(`[api] ${method} ${path} → ${res.status}`, data);
    }
    throw new ApiError(
      data?.message ?? `Request failed (${res.status})`,
      res.status,
      data
    );
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
};