import Link from "next/link";
import { GraduationCap, Upload, CheckSquare, AlertTriangle, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900">DeadlinePilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 pt-20 pb-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mb-6 border border-indigo-100">
          <span>Built for overwhelmed students</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight mb-5 tracking-tight">
          Stop falling behind.<br />
          <span className="text-indigo-600">Start each day knowing</span><br />
          exactly what to do.
        </h1>

        <p className="text-lg text-zinc-500 mb-8 max-w-lg leading-relaxed">
          Upload your syllabi and assignment PDFs. DeadlinePilot extracts your deadlines,
          scores what&rsquo;s at risk, and gives you a clear daily action plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-zinc-700 font-medium px-6 py-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
              <Upload className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Upload your materials</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Drop in your syllabus or assignment PDF. We extract deadlines and subtasks automatically.
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">See what&rsquo;s at risk</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Assignments due soon with nothing done are flagged clearly — no more surprise deadlines.
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Get your today plan</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              A focused list of exactly what to work on today, ranked by urgency and how far behind you are.
            </p>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="mt-16 w-full bg-zinc-50 rounded-2xl border border-zinc-200 p-6 text-left">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-4">Example dashboard</p>
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Today</p>
              <div className="space-y-2">
                {["Read assignment brief · CS401 · Due in 2 days", "Solve questions 1–3 · CS401 · Due in 2 days", "Draft intro paragraph · ENG302 · Due in 5 days"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-zinc-700">
                    <div className="w-4 h-4 rounded border-2 border-zinc-300 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-4">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">At Risk</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-800 font-medium">Graph Algorithms Problem Set</span>
                <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">Due in 2 days — not started</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        DeadlinePilot — built for students who don&rsquo;t want to fall behind
      </footer>
    </div>
  );
}
