import React, { useState, useEffect } from "react";
import { Compass, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import MermaidDiagram from "../components/MermaidDiagram";

type Analysis = {
  id: number;
  repo: string;
  content: string;
  created_at: string;
};

type AnalysisSummary = {
  id: number;
  repo_name: string;
  github_url: string;
  created_at: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  async function fetchHistory() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch("http://localhost:3000/api/analyses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHistory(data.analyses);
        console.log("History loaded:", data.analyses);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }

  async function loadAnalysis(id: number) {
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:3000/api/analyses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load analysis");
        return;
      }

      setAnalysis(data.analysis);
    } catch (err) {
      console.error("Load analysis error:", err);
      setError("Could not connect to server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShare() {
    if (!analysis) return;

    setIsSharing(true);
    setShareUrl("");
    setCopied(false);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/share/${analysis.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create share link");
        return;
      }

      const url = `${window.location.origin}/share/${data.share.token}`;
      setShareUrl(url);
    } catch (err) {
      console.error("Share error:", err);
      setError("Could not create share link.");
    } finally {
      setIsSharing(false);
    }
  }
  useEffect(() => {
    void fetchHistory();
  }, []);

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
      fetchHistory();
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

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 min-h-[calc(100vh-77px)] border-r border-stone/20 px-4 py-6 hidden md:block">
          <h2 className="text-xs font-medium text-ink-light uppercase tracking-wide mb-4 px-2">
            Your analyses
          </h2>

          <div className="space-y-1">
            {history.length === 0 && (
              <p className="text-sm text-ink-light px-2">No analyses yet.</p>
            )}

            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadAnalysis(item.id)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-paper-dark transition group"
              >
                <div className="text-sm text-ink truncate group-hover:text-forest transition">
                  {item.repo_name}
                </div>
                <div className="text-xs text-ink-light">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 px-6 md:px-12 pt-12 pb-32">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-4xl font-medium text-ink mb-2 tracking-tight">
              Analyze a repository
            </h1>

            <p className="text-ink-light mb-8">
              Paste a public GitHub URL and CodeMap will explain how the
              codebase works.
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
              <div className="mt-8 rounded-md border border-stone/30 bg-white p-8">
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-serif text-2xl text-ink">Analysis</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink-light font-mono">
                      {analysis.repo}
                    </span>
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="text-sm text-forest hover:text-forest-hover font-medium transition disabled:opacity-50"
                    >
                      {isSharing ? "Creating link..." : "Share"}
                    </button>
                  </div>
                </div>

                {shareUrl && (
                  <div className="mb-6 p-3 rounded-md bg-paper-dark flex items-center justify-between gap-3">
                    <code className="text-sm text-ink truncate">
                      {shareUrl}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-sm text-forest hover:text-forest-hover font-medium whitespace-nowrap"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}

                <div className="prose prose-stone max-w-none">
                  <ReactMarkdown
                    components={{
                      pre({ children }) {
                        const child = Array.isArray(children)
                          ? children[0]
                          : children;

                        const childClassName = React.isValidElement<{
                          className?: string;
                        }>(child)
                          ? child.props.className || ""
                          : "";

                        if (childClassName.includes("language-mermaid")) {
                          return <>{children}</>;
                        }

                        return (
                          <pre className="bg-paper-dark text-ink rounded-md p-4 overflow-x-auto text-sm">
                            {children}
                          </pre>
                        );
                      },

                      code({ className, children, ...props }) {
                        const isMermaid =
                          className?.includes("language-mermaid");

                        if (isMermaid) {
                          return (
                            <MermaidDiagram chart={String(children).trim()} />
                          );
                        }

                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {analysis.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
