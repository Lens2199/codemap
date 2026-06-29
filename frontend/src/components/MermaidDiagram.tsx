import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Initialize mermaid once when this module loads
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  themeVariables: {
    background: 'transparent',
    lineColor: '#8b8378',
    primaryColor: '#f4ede0',
    primaryBorderColor: '#4a8061',
    primaryTextColor: '#2a2724',
  },
});

type MermaidDiagramProps = {
  chart: string;
};

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // A unique id is required for each render
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [chart]);

  if (error) {
    return (
      <div
        ref={containerRef}
        className="my-6 flex justify-center rounded-md border border-stone/20 bg-white p-6"
      />
    );
  }

  return <div ref={containerRef} className="my-6 flex justify-center" />;
}
