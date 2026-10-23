const PHONE_RE = /^\+[1-9]\d{7,14}$/;
const byteLength = (s) => new TextEncoder().encode(s).length;

export const validatePhone = (v) =>
  PHONE_RE.test(v) ? "" : "Enter a valid phone number";

export const validateNewPassword = (v) => {
  if (v.length < 8) return "Use at least 8 characters";
  if (byteLength(v) > 72) return "Password is too long";
  return "";
};

export const validateLoginPassword = (v) => (v ? "" : "Enter your password");

// Maps the backend's zod error array to { field: message }
export const apiFieldErrors = (err) => {
  if (err?.status !== 400 || !Array.isArray(err.data?.errors)) return {};
  return Object.fromEntries(err.data.errors.map((e) => [e.field, e.message]));
};