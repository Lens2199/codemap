import { useState } from "react";
import { Compass, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Analysis = {
  id: number;
  repo: string;
  content: string;
  created_at: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  async function handleAnalyze() {
    setError("");
    setAnalysis(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setAnalysis(data.analysis);
    } catch (err) {
      console.error("Analyze network error:", err);
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header with logo + logout */}
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="text-forest" size={28} />
          <span className="font-serif text-2xl font-medium text-ink">
            CodeMap
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-ink-light hover:text-ink text-sm font-medium transition"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </header>

      {/* Analyze section */}
      <main className="px-6 md:px-12 lg:px-20 pt-12 pb-32">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-4xl font-medium text-ink mb-2 tracking-tight">
            Analyze a repository
          </h1>

          <p className="text-ink-light mb-8">
            Paste a public GitHub URL and CodeMap will explain how the codebase
            works.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-4 py-3 rounded-md border border-stone/30 bg-white text-ink focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition"
            />

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-forest hover:bg-forest-hover text-white font-medium px-7 py-3.5 rounded-md transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {analysis && (
            <div className="mt-8 rounded-md border border-stone/30 bg-white p-5">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-serif text-2xl text-ink">Analysis</h2>
                <span className="text-sm text-ink-light font-mono">
                  {analysis.repo}
                </span>
              </div>

              <pre className="text-sm text-ink-light whitespace-pre-wrap font-sans">
                {analysis.content}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}