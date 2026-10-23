import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import { PasswordField } from "../../components/ui/Field.jsx";
import PhoneInput from "../../components/ui/PhoneInput.jsx";
import Notice from "../../components/ui/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  apiFieldErrors,
  validateLoginPassword,
  validatePhone,
} from "../../lib/validators.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [phone, setPhone] = useState(state?.phone ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const next = {
      phone: validatePhone(phone),
      password: validateLoginPassword(password),
    };
    setErrors(next);
    if (next.phone || next.password) return;

    setSubmitting(true);
    try {
      const session = await login(phone, password);
      if (!session) {
        setFormError("Signed in, but the session could not start. Try again.");
      }
      // On success, GuestRoute redirects to /app
    } catch (err) {
      if (err.status === 403) {
        // Correct password, number not verified yet
        navigate("/verify-otp", { state: { phone, sent: false } });
        return;
      }

      const fields = apiFieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields);
      else setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your phone number and password."
      footer={
        <>
          New to Aditus?{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {state?.verified && (
          <Notice tone="info">Phone verified. Sign in to continue.</Notice>
        )}
        <Notice>{formError}</Notice>

        <PhoneInput
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          autoFocus={!phone}
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          autoFocus={Boolean(phone)}
        />

        <Button type="submit" loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}