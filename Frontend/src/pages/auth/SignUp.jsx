import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import { PasswordField } from "../../components/ui/Field.jsx";
import PhoneInput from "../../components/ui/PhoneInput.jsx";
import Notice from "../../components/ui/Notice.jsx";
import { api } from "../../lib/api.js";
import {
  apiFieldErrors,
  validateNewPassword,
  validatePhone,
} from "../../lib/validators.js";

export default function Signup() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const next = {
      phone: validatePhone(phone),
      password: validateNewPassword(password),
    };
    setErrors(next);
    if (next.phone || next.password) return;

    setSubmitting(true);
    try {
      await api.post("/auth/register", { phone, password });
      navigate("/verify-otp", { state: { phone, sent: true } });
    } catch (err) {
      // Account was created but the SMS failed: resume from the verify page
      if (err.status === 502) {
        navigate("/verify-otp", { state: { phone, sent: false } });
        return;
      }

      const fields = apiFieldErrors(err);
      if (Object.keys(fields).length) {
        setErrors(fields);
      } else if (err.status === 409) {
        setFormError(
          "This number is already registered. Sign in instead. If it isn't verified yet, you'll be taken to verification."
        );
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your phone number is your login."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Notice>{formError}</Notice>

        <PhoneInput
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          autoFocus
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters."
          autoComplete="new-password"
        />

        <Button type="submit" loading={submitting}>
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
}