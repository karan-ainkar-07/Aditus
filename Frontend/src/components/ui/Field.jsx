import { useId, useState } from "react";

export default function Field({
  label,
  error,
  hint,
  trailing,
  inputClassName = "h-11 text-[15px]",
  ...props
}) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-surface px-3.5 outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15 ${
            error ? "border-danger" : "border-line"
          } ${trailing ? "pr-16" : ""} ${inputClassName}`}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-3.5 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function PasswordField(props) {
  const [show, setShow] = useState(false);

  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-xs font-medium text-accent"
        >
          {show ? "Hide" : "Show"}
        </button>
      }
    />
  );
}