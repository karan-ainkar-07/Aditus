import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";

export default function ErrorPage({ code, title, text }) {
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <p className="text-6xl font-semibold tracking-tight">{code}</p>
        <h1 className="mt-4 text-lg font-medium">{title}</h1>
        <p className="mt-1 text-sm text-muted">{text}</p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}