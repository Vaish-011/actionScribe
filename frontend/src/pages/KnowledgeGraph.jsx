import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import toast from "react-hot-toast";

const typeStyles = {
  meeting: { fill: "#4f46e5", stroke: "#1e1b4b", label: "Meeting" },
  decision: { fill: "#db2777", stroke: "#831843", label: "Decision" },
  task: { fill: "#059669", stroke: "#064e3b", label: "Task" },
  person: { fill: "#f59e0b", stroke: "#92400e", label: "Person" }
};

function KnowledgeGraph() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [query, setQuery] = useState("");

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await API.get("/ai/knowledge-graph");
      setGraph({
        nodes: res.data.nodes || [],
        edges: res.data.edges || [],
        summary: res.data.summary || null
      });
      setSelectedNode(null);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load knowledge graph");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const visibleNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return graph.nodes;
    return graph.nodes.filter((node) => {
      const text = `${node.label} ${node.type} ${(node.meta && Object.values(node.meta).join(" ")) || ""}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [graph.nodes, query]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const layout = useMemo(() => {
    const width = 1200;
    const height = 760;
    const centerX = width / 2;
    const centerY = height / 2;
    const groups = {
      meeting: visibleNodes.filter((node) => node.type === "meeting"),
      decision: visibleNodes.filter((node) => node.type === "decision"),
      task: visibleNodes.filter((node) => node.type === "task"),
      person: visibleNodes.filter((node) => node.type === "person")
    };

    const positions = {};
    const ringConfig = {
      meeting: { radius: 90, start: -Math.PI / 2 },
      decision: { radius: 220, start: -Math.PI / 3 },
      task: { radius: 340, start: Math.PI / 8 },
      person: { radius: 460, start: Math.PI / 2 }
    };

    Object.entries(groups).forEach(([type, items]) => {
      const cfg = ringConfig[type];
      const step = items.length ? (Math.PI * 2) / Math.max(items.length, 1) : 0;

      items.forEach((node, index) => {
        const angle = cfg.start + step * index;
        const x = centerX + Math.cos(angle) * cfg.radius;
        const y = centerY + Math.sin(angle) * cfg.radius;
        positions[node.id] = {
          x,
          y,
          type,
          radius: type === "meeting" ? 42 : type === "decision" ? 38 : type === "task" ? 36 : 34
        };
      });
    });

    return { width, height, centerX, centerY, positions };
  }, [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return graph.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  }, [graph.edges, visibleNodeIds]);

  const selectedDetails = selectedNode || visibleNodes[0] || null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Project Knowledge Graph</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Meetings, decisions, tasks, and people linked as an execution map.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 py-2 text-sm min-w-[260px]"
              placeholder="Filter graph by keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={loadGraph} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">Refresh</button>
          </div>
        </div>

        {graph.summary && (
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Meetings</p><p className="text-2xl font-bold dark:text-white">{graph.summary.meetings}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Decisions</p><p className="text-2xl font-bold dark:text-white">{graph.summary.decisions}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Tasks</p><p className="text-2xl font-bold dark:text-white">{graph.summary.tasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">People</p><p className="text-2xl font-bold dark:text-white">{graph.summary.people}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Relations</p><p className="text-2xl font-bold dark:text-white">{graph.summary.relations}</p></div>
          </section>
        )}

        <section className="grid xl:grid-cols-[1.5fr,0.85fr] gap-4 items-start">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="font-semibold dark:text-white">Graph View</h2>
                <p className="text-xs text-gray-500 dark:text-gray-300">Click a node to inspect its context.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {Object.entries(typeStyles).map(([type, style]) => (
                  <span key={type} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-gray-700 px-2 py-1 text-gray-700 dark:text-gray-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: style.fill }} />
                    {style.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-auto">
              <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full h-[760px] bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.18" />
                  </filter>
                  <linearGradient id="edgeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity="0.35" />
                  </linearGradient>
                </defs>

                <circle cx={layout.centerX} cy={layout.centerY} r="48" fill="#111827" opacity="0.06" />

                {visibleEdges.map((edge) => {
                  const source = layout.positions[edge.source];
                  const target = layout.positions[edge.target];
                  if (!source || !target) return null;

                  return (
                    <g key={edge.id}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="url(#edgeGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 - 4}
                        textAnchor="middle"
                        className="fill-gray-500 dark:fill-gray-300"
                        fontSize="11"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {visibleNodes.map((node) => {
                  const pos = layout.positions[node.id];
                  if (!pos) return null;
                  const isSelected = selectedDetails?.id === node.id;
                  const style = typeStyles[node.type] || typeStyles.person;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedNode(node)}
                    >
                      <circle
                        r={pos.radius + 12}
                        fill={style.fill}
                        opacity={isSelected ? 0.22 : 0.14}
                      />
                      <circle
                        r={pos.radius}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth={isSelected ? 4 : 2}
                        filter="url(#shadow)"
                      />
                      <text
                        textAnchor="middle"
                        y="-2"
                        className="fill-white"
                        fontSize="13"
                        fontWeight="700"
                      >
                        {node.label.length > 18 ? `${node.label.slice(0, 18)}…` : node.label}
                      </text>
                      <text
                        textAnchor="middle"
                        y="16"
                        className="fill-white"
                        fontSize="10"
                        opacity="0.85"
                      >
                        {typeStyles[node.type]?.label || node.type}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <aside className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-4 sticky top-24">
            <div>
              <h2 className="font-semibold dark:text-white">Node Details</h2>
              <p className="text-xs text-gray-500 dark:text-gray-300">Selected node and metadata.</p>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading graph...</p>
            ) : selectedDetails ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 dark:bg-gray-700 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                  <p className="font-semibold dark:text-white">{typeStyles[selectedDetails.type]?.label || selectedDetails.type}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-gray-700 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Label</p>
                  <p className="font-semibold dark:text-white">{selectedDetails.label}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-gray-700 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Metadata</p>
                  {Object.entries(selectedDetails.meta || {}).length ? Object.entries(selectedDetails.meta).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium capitalize dark:text-white">{key}:</span>{" "}
                      <span className="text-gray-600 dark:text-gray-300">{String(value || "N/A")}</span>
                    </div>
                  )) : <p className="text-sm text-gray-500">No metadata available.</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No node selected.</p>
            )}

            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-600 dark:text-gray-300">
              Use the search box to isolate a part of the graph. This view is deterministic and works without extra visualization libraries.
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

export default KnowledgeGraph;