import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="px-6 py-5">
        <div className="flex items-center gap-2">
          <Compass className="text-forest" size={28} />
          <span className="font-serif text-2xl font-semibold text-ink">
            CodeMap
          </span>
        </div>
      </header>

      {/* Hero (existing content) */}
      <main className="px-6 md:px-12 lg:px-20 pt-24 pb-32">
        <div className="max-w-4xl">
          <h1 className="font-serif text-5xl md:text-7xl font-medium text-ink mb-8 tracking-tight leading-[1.1]">
            Understand any codebase in seconds.
          </h1>
          <p className="text-xl md:text-2xl text-ink-light mb-12 leading-relaxed max-w-2xl">
            Paste a GitHub URL and get an AI-powered explanation of the
            architecture, key files, and where to start reading.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="bg-forest hover:bg-forest-hover text-white font-medium px-7 py-3.5 rounded-md transition"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="bg-paper-dark hover:bg-stone/30 text-ink font-medium px-7 py-3.5 rounded-md transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
