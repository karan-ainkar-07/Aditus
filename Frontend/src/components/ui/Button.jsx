const variants = {
  primary: "bg-accent text-white hover:brightness-110 active:brightness-95",
  secondary: "border border-line bg-surface text-fg hover:bg-bg",
};

export default function Button({
  children,
  loading = false,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}