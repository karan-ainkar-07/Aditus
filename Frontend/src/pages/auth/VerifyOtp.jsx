import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
import Notice from "../../components/ui/Notice.jsx";
import { api } from "../../lib/api.js";

const RESEND_SECONDS = 60;

export default function VerifyOtp() {
  const { state } = useLocation();

  if (!state?.phone) return <Navigate to="/signup" replace />;

  return <VerifyForm phone={state.phone} sent={Boolean(state.sent)} />;
}

function VerifyForm({ phone, sent }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeSent, setCodeSent] = useState(sent);
  const [cooldown, setCooldown] = useState(sent ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value) => {
    if (submitting) return;
    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      await api.post("/auth/verify-otp", { phone, code: value });
      navigate("/login", { replace: true, state: { phone, verified: true } });
    } catch (err) {
      setError(err.message);
      setCode("");
      setSubmitting(false);
    }
  };

  const onChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(v);
    if (v.length === 6) submit(v);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (code.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    submit(code);
  };

  const resend = async () => {
    setError("");
    setInfo("");
    setResending(true);

    try {
      const data = await api.post("/auth/resend-otp", { phone });
      setInfo(data?.message ?? "Code sent");
      setCodeSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
      if (err.status === 429) setCooldown(RESEND_SECONDS);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your number"
      subtitle={
        codeSent
          ? `Enter the 6-digit code sent to ${phone}.`
          : `${phone} isn't verified yet. Send a code to continue.`
      }
      footer={
        <div className="space-y-2">
          <div>
            {cooldown > 0 ? (
              <span>Resend code in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={resend}
                disabled={resending}
                className="font-medium text-accent hover:underline disabled:opacity-50"
              >
                {codeSent ? "Resend code" : "Send code"}
              </button>
            )}
          </div>
          <div>
            <Link to="/signup" className="hover:text-fg">
              Use a different number
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Notice tone="info">{info}</Notice>
        <Notice>{error}</Notice>

        <Field
          label="Verification code"
          value={code}
          onChange={onChange}
          readOnly={submitting}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          autoFocus
          inputClassName="h-14 text-center text-2xl font-medium tracking-[0.5em]"
        />

        <Button type="submit" loading={submitting}>
          Verify
        </Button>
      </form>
    </AuthLayout>
  );
}