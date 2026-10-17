
import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: "▦",
    title: "Easy appointment booking",
    description:
      "Find a suitable appointment and book your clinic visit without unnecessary back-and-forth.",
    color: "bg-teal-50 text-teal-700",
  },
  {
    icon: "◷",
    title: "Live queue tracking",
    description:
      "Follow queue progress and make informed decisions about when to arrive.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: "✓",
    title: "Organized healthcare",
    description:
      "Keep appointments and visit information organized in one convenient place.",
    color: "bg-violet-50 text-violet-700",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign in to access your Aditus experience.",
  },
  {
    number: "02",
    title: "Book your appointment",
    description: "Choose your clinic, doctor, and available slot.",
  },
  {
    number: "03",
    title: "Track your queue",
    description: "Follow your queue status and prepare for your visit.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-white font-sans text-slate-800">
      {/* Navbar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-xl font-bold text-white">
            A
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            aditus
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          <a href="#features" className="transition hover:text-teal-700">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-teal-700">
            How it works
          </a>
        </nav>

        <Link
          to="/login"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold transition hover:border-teal-700 hover:text-teal-700"
        >
          Login <span className="ml-2">→</span>
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              A simpler way to manage healthcare
            </div>

            <h1 className="mt-7 text-5xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
              Better care.
              <br />
              <span className="text-teal-700">Less waiting.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
              Book appointments, track your place in the queue, and
              spend less time waiting. Aditus makes every clinic visit
              a little simpler.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-4 rounded-xl bg-teal-700 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-teal-800"
              >
                Get started <span>→</span>
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:text-teal-700"
              >
                Discover how it works
              </a>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs leading-6 text-slate-500">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-50 font-bold text-teal-700">
                ✓
              </span>
              Simple booking. Smarter queues. Better experiences.
            </div>
          </div>

          {/* Appointment preview */}
          <div className="relative mx-auto flex w-full max-w-lg items-center justify-center py-8">
            <div className="absolute inset-8 rounded-full bg-teal-50 blur-3xl" />

            <div className="relative w-full rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl shadow-teal-900/[0.08] sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
                    YOUR NEXT VISIT
                  </p>
                  <h2 className="mt-2 text-lg font-bold tracking-tight">
                    Appointment overview
                  </h2>
                </div>

                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-xl text-teal-700">
                  ▦
                </span>
              </div>

              <div className="mt-7 flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-100 font-bold text-teal-800">
                  DR
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Your doctor</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Clinic appointment
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Booked
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6">
                <div>
                  <p className="text-xs text-slate-400">Appointment</p>
                  <p className="mt-2 text-sm font-semibold">Selected slot</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Queue status</p>
                  <p className="mt-2 text-sm font-semibold">Track your turn</p>
                </div>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">Live queue</p>
                  <span className="flex items-center gap-1.5 text-xs text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Queue updates
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-teal-100">
                  <div className="h-full w-[63%] rounded-full bg-teal-600" />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Know where you stand before your visit.
                </p>
              </div>

              <div className="absolute -bottom-5 right-3 flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs font-semibold shadow-lg sm:-right-5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-50 text-teal-700">
                  ✓
                </span>
                Your visit, organized
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-slate-50 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-teal-700">
                WHY ADITUS
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Healthcare, without the hassle.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Everything you need for a more organized clinic visit.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/[0.04]"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${feature.color}`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-bold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24"
        >
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] text-teal-700">
              HOW IT WORKS
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three steps to a smoother visit.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-t border-slate-200 pt-6"
              >
                <span className="text-sm font-extrabold text-teal-700">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="mx-5 mb-16 rounded-3xl border border-teal-100 bg-teal-50 px-6 py-12 sm:mx-8 sm:px-12 md:mx-auto md:flex md:max-w-7xl md:items-center md:justify-between md:gap-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-teal-700">
              YOUR TIME MATTERS
            </p>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Make your next visit simpler.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Start organizing your healthcare experience with Aditus.
            </p>
          </div>

          <Link
            to="/register"
            className="mt-7 inline-flex shrink-0 items-center gap-4 rounded-xl bg-teal-700 px-6 py-4 text-sm font-semibold text-white transition hover:bg-teal-800 md:mt-0"
          >
            Get started <span>→</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 font-bold text-white">
              A
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              aditus
            </span>
          </Link>

          <p className="text-xs text-slate-500">
            Making healthcare visits simpler.
          </p>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Aditus
          </p>
        </div>
      </footer>
    </div>
  );
}
