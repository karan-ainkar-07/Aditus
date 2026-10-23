import ThemeToggle from "./ThemeToggle.jsx";

export default function Placeholder({ title }) {
  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Placeholder</p>
      </div>
    </div>
  );
}