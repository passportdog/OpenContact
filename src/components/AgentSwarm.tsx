"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AGENTS, PIPELINE_PRESETS, QUICK_TASKS } from "@/lib/agents";
import type { AgentDefinition } from "@/lib/agents";

// ─── TYPES ───

interface AgentResult {
  agent: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  elapsed: string;
  timestamp: string;
}

interface HistoryEntry {
  task: string;
  pipeline: string;
  results: AgentResult[];
  tokens: number;
  timestamp: string;
}

// ─── MAIN COMPONENT ───

export default function AgentSwarm() {
  const [task, setTask] = useState("");
  const [pipeline, setPipeline] = useState("full-feature");
  const [customSteps, setCustomSteps] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [results, setResults] = useState<AgentResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const resultsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results, currentAgent]);

  const activePipeline = useMemo(
    () =>
      pipeline === "custom"
        ? customSteps
        : PIPELINE_PRESETS[pipeline]?.steps || [],
    [pipeline, customSteps]
  );

  const callAgent = useCallback(
    async (
      agentKey: string,
      taskText: string,
      priorContext: AgentResult[],
      signal: AbortSignal
    ) => {
      const agent: AgentDefinition = AGENTS[agentKey];
      const messages: { role: string; content: string }[] = [];

      if (priorContext.length > 0) {
        const ctxSummary = priorContext
          .map(
            (r) =>
              `--- ${AGENTS[r.agent].name} Output ---\n${r.content}`
          )
          .join("\n\n");
        messages.push({
          role: "user",
          content: `PRIOR AGENT OUTPUTS:\n${ctxSummary}\n\n---\n\nNow, as the ${agent.name}, handle this task:\n${taskText}`,
        });
      } else {
        messages.push({ role: "user", content: taskText });
      }

      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: agent.systemPrompt,
          messages,
        }),
        signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `${agent.name} failed (${response.status}): ${errData.error || "Unknown error"}`
        );
      }

      const data = await response.json();
      const content =
        data.content?.map((b: { text?: string }) => b.text || "").join("") ||
        "";
      const usage = data.usage || {};

      return {
        content,
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
      };
    },
    []
  );

  const runSwarm = useCallback(async () => {
    if (!task.trim() || activePipeline.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setError(null);
    setCurrentAgent(null);
    setTotalTokens(0);
    setExpandedResult(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const collectedResults: AgentResult[] = [];
    let tokens = 0;

    try {
      for (let i = 0; i < activePipeline.length; i++) {
        if (controller.signal.aborted) break;

        const agentKey = activePipeline[i];
        setCurrentAgent(agentKey);

        const startTime = Date.now();
        const result = await callAgent(
          agentKey,
          task,
          collectedResults,
          controller.signal
        );
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        tokens += result.inputTokens + result.outputTokens;
        setTotalTokens(tokens);

        const entry: AgentResult = {
          agent: agentKey,
          content: result.content,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          elapsed,
          timestamp: new Date().toISOString(),
        };
        collectedResults.push(entry);
        setResults((prev) => [...prev, entry]);
        setExpandedResult(i);
      }

      setHistory((prev) =>
        [
          {
            task,
            pipeline:
              pipeline === "custom"
                ? "Custom"
                : PIPELINE_PRESETS[pipeline]?.name || pipeline,
            results: collectedResults,
            tokens,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20)
      );
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsRunning(false);
      setCurrentAgent(null);
      abortRef.current = null;
    }
  }, [task, activePipeline, pipeline, callAgent]);

  const stopSwarm = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setCurrentAgent(null);
  };

  const toggleStep = (agentKey: string) => {
    setPipeline("custom");
    setCustomSteps((prev) =>
      prev.includes(agentKey)
        ? prev.filter((s) => s !== agentKey)
        : [...prev, agentKey]
    );
  };

  const copyResult = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #0c1220 100%)",
        color: "#e2e8f0",
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(51,65,85,0.5)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(20px)",
          background: "rgba(15,23,42,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "white",
            }}
          >
            <span role="img" aria-label="lightning">
              &#x26A1;
            </span>
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.02em",
              }}
            >
              OpenContact Agent Swarm
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Multi-agent frontend builder
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {totalTokens > 0 && (
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                background: "rgba(30,41,59,0.8)",
                padding: "4px 10px",
                borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {totalTokens.toLocaleString()} tokens
            </div>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: showHistory ? "#1e293b" : "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          maxWidth: 1400,
          margin: "0 auto",
          minHeight: "calc(100vh - 69px)",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 300,
            borderRight: "1px solid rgba(51,65,85,0.3)",
            padding: 20,
            flexShrink: 0,
            overflowY: "auto",
            background: "rgba(15,23,42,0.4)",
          }}
        >
          {/* Pipeline Selection */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Pipeline
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {Object.entries(PIPELINE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => {
                    setPipeline(key);
                    setCustomSteps([]);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    textAlign: "left",
                    background:
                      pipeline === key
                        ? "rgba(37,99,235,0.15)"
                        : "transparent",
                    color:
                      pipeline === key ? "#60a5fa" : "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {preset.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      marginTop: 2,
                    }}
                  >
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Toggles */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Agents{" "}
              {pipeline === "custom" && (
                <span style={{ color: "#60a5fa" }}>
                  &bull; custom
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {Object.entries(AGENTS).map(([key, agent]) => {
                const isActive = activePipeline.includes(key);
                const stepNum = activePipeline.indexOf(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleStep(key)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      textAlign: "left",
                      border: `1px solid ${
                        isActive ? agent.color + "40" : "transparent"
                      }`,
                      background: isActive
                        ? agent.color + "10"
                        : "transparent",
                      color: isActive ? "#e2e8f0" : "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: -1,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 20,
                          borderRadius: 2,
                          background: agent.color,
                        }}
                      />
                    )}
                    <span style={{ fontSize: 16 }}>{agent.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {agent.name}
                      </div>
                      <div
                        style={{ fontSize: 10, color: "#64748b" }}
                      >
                        {agent.role.substring(0, 45)}...
                      </div>
                    </div>
                    {isActive && (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          background: agent.color + "30",
                          color: agent.color,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {stepNum + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tasks */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Quick Tasks
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {QUICK_TASKS.map((qt, i) => (
                <button
                  key={i}
                  onClick={() => setTask(qt.task)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "none",
                    background:
                      task === qt.task
                        ? "rgba(37,99,235,0.15)"
                        : "transparent",
                    color:
                      task === qt.task ? "#60a5fa" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Task Input */}
          <div
            style={{
              padding: 20,
              borderBottom: "1px solid rgba(51,65,85,0.3)",
            }}
          >
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe what you want to build..."
              style={{
                width: "100%",
                minHeight: 90,
                padding: 14,
                borderRadius: 12,
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#e2e8f0",
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "#2563eb")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "#334155")
              }
            />
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              {!isRunning ? (
                <button
                  onClick={runSwarm}
                  disabled={
                    !task.trim() || activePipeline.length === 0
                  }
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      !task.trim() || activePipeline.length === 0
                        ? "#1e293b"
                        : "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color:
                      !task.trim() || activePipeline.length === 0
                        ? "#475569"
                        : "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor:
                      !task.trim() || activePipeline.length === 0
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  &#x26A1; Run Swarm ({activePipeline.length}{" "}
                  agents)
                </button>
              ) : (
                <button
                  onClick={stopSwarm}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "1px solid #ef4444",
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  &#x25A0; Stop
                </button>
              )}
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {activePipeline
                  .map((s) => AGENTS[s]?.icon)
                  .join(" -> ")}
              </div>
            </div>
          </div>

          {/* Results */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: 20 }}
          >
            {/* Active Pipeline Visualization */}
            {isRunning && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: 20,
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(30,41,59,0.5)",
                  border: "1px solid #1e293b",
                  overflowX: "auto",
                }}
              >
                {activePipeline.map((step, i) => {
                  const agent = AGENTS[step];
                  const isDone = results.some(
                    (r) => r.agent === step
                  );
                  const isCurrent = currentAgent === step;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap",
                          background: isCurrent
                            ? agent.color + "20"
                            : isDone
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(30,41,59,0.5)",
                          border: `1px solid ${
                            isCurrent
                              ? agent.color
                              : isDone
                              ? "#10b981" + "40"
                              : "#334155"
                          }`,
                          color: isCurrent
                            ? agent.color
                            : isDone
                            ? "#10b981"
                            : "#64748b",
                          animation: isCurrent
                            ? "pulse 2s infinite"
                            : "none",
                        }}
                      >
                        <span>{agent.icon}</span>
                        {agent.name}
                        {isDone && <span>&#x2713;</span>}
                        {isCurrent && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: agent.color,
                              animation: "pulse 1s infinite",
                            }}
                          />
                        )}
                      </div>
                      {i < activePipeline.length - 1 && (
                        <span
                          style={{
                            color: "#334155",
                            fontSize: 14,
                          }}
                        >
                          &rarr;
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                  fontSize: 13,
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Result Cards */}
            {results.map((result, i) => {
              const agent = AGENTS[result.agent];
              const isExpanded = expandedResult === i;
              return (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: `1px solid ${agent.color}20`,
                    background: "rgba(30,41,59,0.3)",
                  }}
                >
                  {/* Header */}
                  <div
                    onClick={() =>
                      setExpandedResult(isExpanded ? null : i)
                    }
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      background: isExpanded
                        ? agent.color + "08"
                        : "transparent",
                      borderBottom: isExpanded
                        ? `1px solid ${agent.color}15`
                        : "none",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>
                      {agent.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: agent.color,
                        }}
                      >
                        {agent.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#64748b" }}
                      >
                        {result.elapsed}s &bull;{" "}
                        {(
                          result.inputTokens + result.outputTokens
                        ).toLocaleString()}{" "}
                        tokens
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyResult(result.content);
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #334155",
                        background: "transparent",
                        color: "#64748b",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      Copy
                    </button>
                    <span
                      style={{
                        color: "#475569",
                        fontSize: 16,
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "none",
                        transition: "0.2s",
                      }}
                    >
                      &#x25BE;
                    </span>
                  </div>
                  {/* Content */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: 16,
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontFamily:
                          "'JetBrains Mono', monospace",
                        color: "#cbd5e1",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: 600,
                        overflowY: "auto",
                        background: "rgba(15,23,42,0.4)",
                      }}
                    >
                      {result.content}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading State */}
            {isRunning && currentAgent && (
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: `${AGENTS[currentAgent].color}08`,
                  border: `1px solid ${AGENTS[currentAgent].color}20`,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${AGENTS[currentAgent].color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    animation: "pulse 2s infinite",
                  }}
                >
                  {AGENTS[currentAgent].icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: AGENTS[currentAgent].color,
                    }}
                  >
                    {AGENTS[currentAgent].name} is working...
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginTop: 2,
                    }}
                  >
                    {AGENTS[currentAgent].role}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: `2px solid ${AGENTS[currentAgent].color}30`,
                      borderTopColor: AGENTS[currentAgent].color,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isRunning && results.length === 0 && !error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#475569",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  &#x26A1;
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  Ready to build
                </div>
                <div
                  style={{
                    fontSize: 13,
                    maxWidth: 400,
                    margin: "0 auto",
                    lineHeight: 1.6,
                  }}
                >
                  Select a quick task or describe what you want to
                  build. Choose a pipeline and hit Run Swarm.
                </div>
              </div>
            )}

            <div ref={resultsEndRef} />
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div
            style={{
              width: 320,
              borderLeft: "1px solid rgba(51,65,85,0.3)",
              padding: 16,
              overflowY: "auto",
              background: "rgba(15,23,42,0.4)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              History
            </div>
            {history.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: "#475569",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No runs yet
              </div>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setTask(h.task);
                    setResults(h.results);
                    setExpandedResult(h.results.length - 1);
                    setShowHistory(false);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 6,
                    cursor: "pointer",
                    background: "rgba(30,41,59,0.3)",
                    border: "1px solid #1e293b",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      "#334155")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "#1e293b")
                  }
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#e2e8f0",
                      marginBottom: 4,
                    }}
                  >
                    {h.task.substring(0, 60)}...
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <span>{h.pipeline}</span>
                    <span>
                      {h.tokens.toLocaleString()} tokens
                    </span>
                    <span>
                      {new Date(
                        h.timestamp
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      marginTop: 4,
                    }}
                  >
                    {h.results.map((r, j) => (
                      <span key={j} style={{ fontSize: 12 }}>
                        {AGENTS[r.agent]?.icon}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        textarea::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}
