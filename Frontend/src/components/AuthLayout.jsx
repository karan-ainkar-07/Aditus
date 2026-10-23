import ThemeToggle from "./ThemeToggle.jsx";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[380px]">
        <p className="mb-10 text-center text-[15px] font-semibold tracking-tight">
          Aditus
        </p>
        <h1 className="text-center text-[28px] font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-center text-[15px] text-muted">{subtitle}</p>
        )}
        <div className="mt-8">{children}</div>
        {footer && (
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        )}
      </div>
    </div>
  );
}