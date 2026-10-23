import { useId, useState } from "react";

const CODES = ["+91", "+1", "+44", "+971", "+65"];

const splitDial = (value) =>
  [...CODES]
    .sort((a, b) => b.length - a.length)
    .find((c) => value?.startsWith(c)) ?? "+91";

export default function PhoneInput({
  label = "Phone number",
  value,
  onChange,
  error,
  autoComplete = "username",
  autoFocus,
}) {
  const id = useId();
  const [dial, setDial] = useState(() => splitDial(value));

  const national = value?.startsWith(dial) ? value.slice(dial.length) : "";
  const maxNational = 15 - (dial.length - 1); // E.164 max is 15 digits total

  const emit = (d, n) => onChange(n ? d + n : "");

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-muted"
      >
        {label}
      </label>
      <div
        className={`flex h-11 overflow-hidden rounded-xl border bg-surface transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 ${
          error ? "border-danger" : "border-line"
        }`}
      >
        <select
          aria-label="Country code"
          value={dial}
          onChange={(e) => {
            setDial(e.target.value);
            emit(e.target.value, national);
          }}
          className="border-r border-line bg-transparent pl-3 pr-2 text-[15px] outline-none"
        >
          {CODES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={national}
          onChange={(e) =>
            emit(
              dial,
              e.target.value
                .replace(/\D/g, "")
                .replace(/^0+/, "") // drop trunk prefix
                .slice(0, maxNational)
            )
          }
          placeholder="98765 43210"
          className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] outline-none placeholder:text-muted/60"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}