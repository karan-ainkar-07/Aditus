const tones = {
  error: "bg-danger/10 text-danger",
  info: "bg-accent/10 text-accent",
};

export default function Notice({ tone = "error", children }) {
  if (!children) return null;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl px-3.5 py-2.5 text-sm ${tones[tone]}`}
    >
      {children}
    </p>
  );
}