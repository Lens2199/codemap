import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Compass } from "lucide-react";
import ReactMarkdown from "react-markdown";
import MermaidDiagram from "../components/MermaidDiagram";

type SharedAnalysis = {
  id: number;
  repo: string;
  github_url: string;
  content: string;
  analyzed_at: string;
};

export default function SharedAnalysis() {
  const { token } = useParams<{ token: string }>();
  const [analysis, setAnalysis] = useState<SharedAnalysis | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadShared() {
      try {
        const response = await fetch(`http://localhost:3000/api/share/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "This share link is invalid or has expired.");
          return;
        }

        setAnalysis(data.analysis);
      } catch (err) {
        console.error("Failed to load shared analysis:", err);
        setError("Could not connect to server.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadShared();
  }, [token]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="px-6 py-5">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <Compass className="text-forest" size={28} />
          <span className="font-serif text-2xl font-medium text-ink">
            CodeMap
          </span>
        </Link>
      </header>

      <main className="px-6 md:px-12 lg:px-20 pt-8 pb-32">
        <div className="max-w-3xl mx-auto">
          {isLoading && (
            <p className="text-ink-light">Loading shared analysis...</p>
          )}

          {error && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {analysis && (
            <div className="rounded-md border border-stone/30 bg-white p-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-serif text-2xl text-ink">Analysis</h2>
                <span className="text-sm text-ink-light font-mono">
                  {analysis.repo}
                </span>
              </div>

              <div className="prose prose-stone max-w-none">
                <ReactMarkdown
                  components={{
                    pre({ children }) {
                      const child = Array.isArray(children) ? children[0] : children;
                      const childClassName =
                        React.isValidElement<{ className?: string }>(child)
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
                      const isMermaid = className?.includes("language-mermaid");
                      if (isMermaid) {
                        return <MermaidDiagram chart={String(children).trim()} />;
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
  );
}