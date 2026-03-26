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
  }
];

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">ActionScribe AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">AI Meeting to Action Tracker</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Login</Link>
          <Link to="/signup" className="px-4 py-2 rounded-lg bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 text-sm font-medium">Create Account</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-10">
        <section className="grid lg:grid-cols-2 gap-6 items-center py-8 md:py-12">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
              Full SaaS Workflow
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Turn Every Meeting Into
              <span className="text-indigo-600 dark:text-indigo-400"> Executed Work</span>
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">
              ActionScribe helps teams summarize discussions, extract actionable tasks, monitor ownership, and close execution gaps.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/signup" className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium">Get Started Free</Link>
              <Link to="/login" className="px-5 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium">Open Workspace</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-5 shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What your team gets</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
              <li>- Meeting upload (text/audio) and AI processing</li>
              <li>- Action extraction with owner + deadline</li>
              <li>- Team dashboard, insights, and follow-up generation</li>
              <li>- Searchable meeting history and chat-based recall</li>
              <li>- Role-based workspace access and exports</li>
            </ul>
          </div>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{feature.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Landing;
