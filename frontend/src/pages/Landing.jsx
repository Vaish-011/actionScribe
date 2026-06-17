import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const features = [
  {
    title: "AI Meeting Intelligence",
    text: "Convert transcripts and recordings into summary, decisions, topics, and action items instantly."
  },
  {
    title: "Kanban Execution Board",
    text: "Track tasks across pending, in-progress, blocked, and completed with team ownership."
  },
  {
    title: "Team Workspace",
    text: "Invite members, assign roles, and manage meetings in a shared organization space."
  },
  {
    title: "Smart Search + Insights",
    text: "Find past discussions quickly and monitor productivity trends with AI-powered analytics."
  },
  {
    title: "Meeting Assistant Chat",
    text: "Ask natural language questions to retrieve key actions and decisions from any meeting."
  },
  {
    title: "Exports + Reporting",
    text: "Export task lists and outcomes for status reviews, stakeholders, and planning sessions."
  },
  {
    title: "Project Knowledge Graph",
    text: "Visualize meetings, decisions, tasks, and people as a connected execution map."
  }
];

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" }
];

function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#eff6ff_40%,_#e0e7ff)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_30%),linear-gradient(to_bottom,_#0f172a,_#111827_45%,_#1f2937)] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">ActionScribe</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">Meeting intelligence for modern teams</p>
            </div>
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <Link to="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">Login</Link>
            <Link to="/signup" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Create Account</Link>
          </div>

          <div className="flex flex-col gap-2 lg:hidden">
            <Link to="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">Login</Link>
            <Link to="/signup" className="rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Create Account</Link>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.15fr,0.85fr] lg:items-center lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-white/5 dark:text-indigo-200">
              Professional meeting workspace
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                Turn meetings into clear actions, decisions, and progress.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                ActionScribe gives your team a polished workspace for meeting notes, task tracking, analytics, and AI-powered follow-up. It is built to look clean on desktop and mobile while keeping the work fast.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="rounded-full bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                Create Account
              </Link>
              <Link to="/login" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Login
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-semibold">AI</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">Summaries and action extraction</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-semibold">Team</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">Shared workspace with roles</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-semibold">Insights</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">Track performance and follow-up</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-indigo-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/85">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Workspace Overview</p>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Everything your team needs in one place</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Live</span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Meeting summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Automatically convert discussions into concise summaries, tasks, and decisions.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Task tracking</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Pending, in progress, blocked, completed.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Analytics</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Completion rate, bottlenecks, workload.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
          <div className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 lg:grid-cols-[0.9fr,1.1fr] lg:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">About us</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">A project built to turn meeting work into execution.</h3>
            </div>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              ActionScribe is an AI-powered meeting management project designed to help teams capture discussions, generate summaries, extract tasks, track decisions, and follow up with clarity. It brings together login and workspace access, dashboard analytics, task management, meeting history, knowledge graph visualization, and AI search into one professional platform for turning conversations into measurable progress.
            </p>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Features</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">A clean layout for the product story</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
                <h3 className="font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/20 dark:bg-white dark:text-slate-950 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300 dark:text-indigo-700">Contact</p>
                <p className="text-sm leading-6 text-slate-300 dark:text-slate-600">
                  If you want to contribute to this website or share improvements, contact me at{" "}
                  <a href="mailto:muskantomar43@gmmail.com" className="font-semibold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white dark:text-slate-900 dark:decoration-slate-500 dark:hover:decoration-slate-700">
                    muskantomar43@gmail.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Landing;
