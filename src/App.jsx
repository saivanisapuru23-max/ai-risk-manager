import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./App.css";

const STORAGE_KEY = "ai-risk-manager-assessments";

const initialForm = {
  projectName: "",
  affectedUsers: "",
  systemPurpose: "",
  aiUsage: "",
  dataProcessed: "",
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [form, setForm] = useState(initialForm);
  const [history, setHistory] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);

        if (parsed.length > 0) {
          setAssessment(parsed[0]);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveHistory = (items) => {
    setHistory(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const analyzeRisk = async () => {
    setError("");

    if (!form.projectName || !form.systemPurpose || !form.aiUsage) {
      setError(
        "Please fill Project Name, System Purpose and How AI Is Used."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze-risk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Risk analysis failed."
        );
      }

      const savedAssessment = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        projectName: form.projectName,
        affectedUsers: form.affectedUsers,
        systemPurpose: form.systemPurpose,
        aiUsage: form.aiUsage,
        dataProcessed: form.dataProcessed,
        overallScore: Number(result.data.overallScore || 0),
        overallLevel: result.data.overallLevel || "Medium",
        summary: result.data.summary || "",
        risks: result.data.risks || [],
      };

      const updatedHistory = [
        savedAssessment,
        ...history,
      ];

      saveHistory(updatedHistory);
      setAssessment(savedAssessment);
      setActivePage("results");
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the Gemini risk analysis service."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAssessment = (item) => {
    setAssessment(item);
    setActivePage("results");
  };

  const startNewAssessment = () => {
    setForm(initialForm);
    setError("");
    setAssessment(null);
    setActivePage("new");
  };

  const deleteHistoryItem = (id) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);

    if (assessment?.id === id) {
      setAssessment(updated[0] || null);
    }
  };

  const downloadReport = (item) => {
    if (!item) return;

    const lines = [];

    lines.push("AI RISK MANAGER");
    lines.push("==============================");
    lines.push("");
    lines.push(`Project: ${item.projectName}`);
    lines.push(
      `Assessment Date: ${formatDate(item.createdAt)}`
    );
    lines.push(
      `Overall Risk Score: ${item.overallScore}/100`
    );
    lines.push(
      `Overall Risk Level: ${item.overallLevel}`
    );
    lines.push("");
    lines.push("SYSTEM INFORMATION");
    lines.push("------------------------------");
    lines.push(
      `Affected Users: ${item.affectedUsers || "Not specified"}`
    );
    lines.push(
      `System Purpose: ${item.systemPurpose || "Not specified"}`
    );
    lines.push(
      `How AI Is Used: ${item.aiUsage || "Not specified"}`
    );
    lines.push(
      `Data Processed: ${item.dataProcessed || "Not specified"}`
    );
    lines.push("");
    lines.push("AI ASSESSMENT SUMMARY");
    lines.push("------------------------------");
    lines.push(item.summary || "No summary available.");
    lines.push("");
    lines.push("RISK CATEGORIES");
    lines.push("==============================");

    item.risks.forEach((risk, index) => {
      lines.push("");
      lines.push(`${index + 1}. ${risk.name}`);
      lines.push(`Score: ${risk.score}/100`);
      lines.push(`Level: ${risk.level}`);
      lines.push(`Impact: ${risk.impact}`);
      lines.push(`Likelihood: ${risk.likelihood}`);
      lines.push(`Explanation: ${risk.description}`);
      lines.push(
        `Recommended Action: ${risk.recommendedAction}`
      );
    });

    lines.push("");
    lines.push("==============================");
    lines.push(
      "Generated by AI Risk Manager - Responsible AI Platform"
    );

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeName = item.projectName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    link.href = url;
    link.download = `${safeName || "ai-risk"}-risk-report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        total: 0,
        highRisks: 0,
        average: 0,
      };
    }

    const highRisks = history.reduce((total, item) => {
      const count = (item.risks || []).filter(
        (risk) =>
          risk.level === "High" ||
          risk.level === "Critical"
      ).length;

      return total + count;
    }, 0);

    const average =
      history.reduce(
        (sum, item) => sum + Number(item.overallScore || 0),
        0
      ) / history.length;

    return {
      total: history.length,
      highRisks,
      average: Math.round(average),
    };
  }, [history]);

  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((item, index) => ({
        name: `A${index + 1}`,
        score: Number(item.overallScore || 0),
        project: item.projectName,
      }));
  }, [history]);

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onNewAssessment={startNewAssessment}
      />

      <main className="main-content">
        <Topbar
          onNewAssessment={startNewAssessment}
        />

        {activePage === "dashboard" && (
          <Dashboard
            history={history}
            stats={stats}
            chartData={chartData}
            onNewAssessment={startNewAssessment}
            onOpenAssessment={openAssessment}
          />
        )}

        {activePage === "new" && (
          <NewAssessment
            form={form}
            updateForm={updateForm}
            analyzeRisk={analyzeRisk}
            loading={loading}
            error={error}
          />
        )}

        {activePage === "results" && (
          <RiskResults
            assessment={assessment}
            onNewAssessment={startNewAssessment}
            onDownload={downloadReport}
          />
        )}

        {activePage === "history" && (
          <RiskHistory
            history={history}
            onOpen={openAssessment}
            onDelete={deleteHistoryItem}
          />
        )}

        {activePage === "reports" && (
          <Reports
            history={history}
            onOpen={openAssessment}
            onDownload={downloadReport}
          />
        )}

        {activePage === "system" && <SystemStatus />}
      </main>
    </div>
  );
}

function Sidebar({
  activePage,
  setActivePage,
  onNewAssessment,
}) {
  const items = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      id: "new",
      icon: "+",
      label: "New Assessment",
    },
    {
      id: "results",
      icon: "◉",
      label: "Risk Results",
    },
    {
      id: "history",
      icon: "↺",
      label: "Risk History",
    },
    {
      id: "reports",
      icon: "▤",
      label: "Reports",
    },
    {
      id: "system",
      icon: "✓",
      label: "System Status",
    },
  ];

  const handleClick = (item) => {
    if (item.id === "new") {
      onNewAssessment();
      return;
    }

    setActivePage(item.id);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🛡️</div>

        <div>
          <h1>AI Risk Manager</h1>
          <p>Responsible AI Platform</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => handleClick(item)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="engine-status">
          <span className="status-dot"></span>

          <div>
            <strong>AI Engine Online</strong>
            <small>Gemini AI Connected</small>
          </div>
        </div>

        <div className="responsible-box">
          <span>🛡️</span>

          <div>
            <strong>Responsible AI</strong>
            <p>
              AI recommendations should be reviewed by
              humans before production decisions.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onNewAssessment }) {
  return (
    <header className="topbar">
      <div>
        <span className="online-label">
          <span className="status-dot"></span>
          AI Engine Online
        </span>
      </div>

      <button
        className="top-new-button"
        onClick={onNewAssessment}
      >
        + New Assessment
      </button>
    </header>
  );
}

function Dashboard({
  history,
  stats,
  chartData,
  onNewAssessment,
  onOpenAssessment,
}) {
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RESPONSIBLE AI</p>
          <h2>Risk Dashboard</h2>
          <p>
            Monitor AI system risk assessments and
            identify areas that need attention.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onNewAssessment}
        >
          + New Assessment
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Assessments"
          value={stats.total}
          icon="◉"
        />

        <StatCard
          title="High / Critical Risks"
          value={stats.highRisks}
          icon="⚠"
        />

        <StatCard
          title="Average Risk Score"
          value={`${stats.average}/100`}
          icon="◈"
        />

        <StatCard
          title="AI Engine"
          value="Online"
          icon="✓"
          green
        />
      </div>

      {history.length > 0 && (
        <div className="dashboard-grid">
          <div className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h3>Risk Score Trend</h3>
                <p>
                  Overall risk score across assessments
                </p>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value}/100`,
                      "Risk Score",
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find(
                        (entry) => entry.name === label
                      );

                      return item?.project || label;
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6d5dfc"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Latest Assessment</h3>
                <p>Most recent AI risk analysis</p>
              </div>
            </div>

            {history[0] && (
              <div className="latest-assessment">
                <div className="latest-top">
                  <div>
                    <h4>{history[0].projectName}</h4>
                    <span>
                      {formatDate(history[0].createdAt)}
                    </span>
                  </div>

                  <RiskLevelBadge
                    level={history[0].overallLevel}
                  />
                </div>

                <div className="latest-score">
                  <strong>
                    {history[0].overallScore}
                  </strong>
                  <span>/100</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          history[0].overallScore
                        )
                      )}%`,
                    }}
                  ></div>
                </div>

                <button
                  className="secondary-button full-width"
                  onClick={() =>
                    onOpenAssessment(history[0])
                  }
                >
                  View Full Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Assessments</h3>
            <p>
              Your latest AI system risk assessments
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            text="Create your first AI risk assessment to see analytics here."
            buttonText="Create Assessment"
            onClick={onNewAssessment}
          />
        ) : (
          <div className="recent-list">
            {history.slice(0, 5).map((item) => (
              <AssessmentRow
                key={item.id}
                item={item}
                onClick={() =>
                  onOpenAssessment(item)
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NewAssessment({
  form,
  updateForm,
  analyzeRisk,
  loading,
  error,
}) {
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">01</p>
          <h2>New Assessment</h2>
          <p>
            Describe your AI system and let Gemini
            identify potential risks.
          </p>
        </div>
      </div>

      <div className="assessment-form">
        <div className="form-card">
          <div className="form-card-header">
            <div className="section-number">01</div>

            <div>
              <h3>System Information</h3>
              <p>
                Tell us about the AI system you want to
                assess.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <Input
              label="Project Name"
              placeholder="e.g. Customer Support AI"
              value={form.projectName}
              onChange={(value) =>
                updateForm("projectName", value)
              }
            />

            <Input
              label="Affected Users"
              placeholder="e.g. Customers and employees"
              value={form.affectedUsers}
              onChange={(value) =>
                updateForm("affectedUsers", value)
              }
            />
          </div>

          <TextArea
            label="System Purpose"
            placeholder="What does this AI system do?"
            value={form.systemPurpose}
            onChange={(value) =>
              updateForm("systemPurpose", value)
            }
          />

          <TextArea
            label="How AI Is Used"
            placeholder="Explain how AI is involved in the system."
            value={form.aiUsage}
            onChange={(value) =>
              updateForm("aiUsage", value)
            }
          />

          <TextArea
            label="Data Processed"
            placeholder="What kind of data does the system process?"
            value={form.dataProcessed}
            onChange={(value) =>
              updateForm("dataProcessed", value)
            }
          />

          {error && (
            <div className="error-message">
              ⚠ {error}
            </div>
          )}

          <button
            className="analyze-button"
            onClick={analyzeRisk}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>🧠 Analyze Risks</>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function RiskResults({
  assessment,
  onNewAssessment,
  onDownload,
}) {
  if (!assessment) {
    return (
      <section className="page">
        <EmptyState
          title="No assessment selected"
          text="Create an assessment to view AI-generated risk results."
          buttonText="New Assessment"
          onClick={onNewAssessment}
        />
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AI ANALYSIS</p>

          <h2>Risk Results</h2>

          <p>
            AI-powered risk assessment for{" "}
            <strong>{assessment.projectName}</strong>
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() =>
              onDownload(assessment)
            }
          >
            ↓ Download Report
          </button>

          <button
            className="primary-button"
            onClick={onNewAssessment}
          >
            + New Assessment
          </button>
        </div>
      </div>

      <div className="results-overview">
        <div className="score-card">
          <span className="score-label">
            OVERALL RISK SCORE
          </span>

          <div className="big-score">
            {assessment.overallScore}
            <span>/100</span>
          </div>

          <RiskLevelBadge
            level={assessment.overallLevel}
          />

          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    assessment.overallScore
                  )
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="summary-card">
          <span className="score-label">
            AI ASSESSMENT SUMMARY
          </span>

          <p>
            {assessment.summary ||
              "No summary available."}
          </p>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h3>Risk Categories</h3>
          <p>
            AI-identified risks across key areas
          </p>
        </div>

        <span className="category-count">
          {assessment.risks.length} Categories
        </span>
      </div>

      <div className="risk-grid">
        {assessment.risks.map((risk, index) => (
          <RiskCard
            key={index}
            risk={risk}
          />
        ))}
      </div>

      <div className="responsible-ai-banner">
        <div className="banner-icon">🛡️</div>

        <div>
          <h3>Responsible AI Review</h3>
          <p>
            This assessment is AI-generated and should
            be treated as decision support. Review the
            identified risks, validate the evidence, and
            apply appropriate human oversight before
            production deployment.
          </p>
        </div>
      </div>
    </section>
  );
}

function RiskHistory({
  history,
  onOpen,
  onDelete,
}) {
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ASSESSMENTS</p>
          <h2>Risk History</h2>
          <p>
            Review previous AI risk assessments.
          </p>
        </div>
      </div>

      <div className="panel">
        {history.length === 0 ? (
          <EmptyState
            title="No assessment history"
            text="Completed assessments will appear here."
          />
        ) : (
          <div className="history-table">
            <div className="history-header">
              <span>PROJECT</span>
              <span>SCORE</span>
              <span>LEVEL</span>
              <span>DATE</span>
              <span>ACTIONS</span>
            </div>

            {history.map((item) => (
              <div
                className="history-row"
                key={item.id}
              >
                <strong>{item.projectName}</strong>

                <span>
                  {item.overallScore}/100
                </span>

                <RiskLevelBadge
                  level={item.overallLevel}
                />

                <span>
                  {formatDate(item.createdAt)}
                </span>

                <div className="row-actions">
                  <button
                    className="table-button"
                    onClick={() => onOpen(item)}
                  >
                    View
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      onDelete(item.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Reports({
  history,
  onOpen,
  onDownload,
}) {
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DOCUMENTATION</p>
          <h2>Reports</h2>
          <p>
            Generate and download AI risk assessment
            reports.
          </p>
        </div>
      </div>

      <div className="reports-grid">
        {history.length === 0 ? (
          <div className="panel">
            <EmptyState
              title="No reports available"
              text="Complete an AI risk assessment to generate your first report."
            />
          </div>
        ) : (
          history.map((item) => (
            <div
              className="report-card"
              key={item.id}
            >
              <div className="report-icon">
                📄
              </div>

              <div className="report-content">
                <h3>{item.projectName}</h3>

                <p>
                  Risk Score:{" "}
                  <strong>
                    {item.overallScore}/100
                  </strong>
                </p>

                <span>
                  {formatDate(item.createdAt)}
                </span>
              </div>

              <RiskLevelBadge
                level={item.overallLevel}
              />

              <div className="report-actions">
                <button
                  className="secondary-button"
                  onClick={() => onOpen(item)}
                >
                  View
                </button>

                <button
                  className="primary-button"
                  onClick={() =>
                    onDownload(item)
                  }
                >
                  ↓ Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SystemStatus() {
  const systems = [
    {
      name: "Frontend Application",
      status: "Operational",
      detail: "React + Vite",
    },
    {
      name: "Backend API",
      status: "Operational",
      detail: "Node.js + Express",
    },
    {
      name: "Gemini AI Engine",
      status: "Connected",
      detail: "Google Gemini API",
    },
    {
      name: "Risk Assessment Engine",
      status: "Operational",
      detail: "AI Risk Analysis",
    },
    {
      name: "Local Assessment Storage",
      status: "Operational",
      detail: "Browser LocalStorage",
    },
  ];

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM</p>
          <h2>System Status</h2>
          <p>
            Monitor the health of AI Risk Manager
            components.
          </p>
        </div>
      </div>

      <div className="status-grid">
        {systems.map((system) => (
          <div
            className="status-card"
            key={system.name}
          >
            <div className="status-card-icon">
              ✓
            </div>

            <div>
              <h3>{system.name}</h3>
              <p>{system.detail}</p>
            </div>

            <span className="operational">
              ● {system.status}
            </span>
          </div>
        ))}
      </div>

      <div className="panel responsible-panel">
        <div className="responsible-large-icon">
          🛡️
        </div>

        <div>
          <h3>Responsible AI Principle</h3>
          <p>
            AI Risk Manager assists organizations by
            identifying potential risks and suggesting
            mitigation actions. Final decisions should
            always involve appropriate human review,
            validation, and organizational governance.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  icon,
  green,
}) {
  return (
    <div className="stat-card">
      <div
        className={`stat-icon ${
          green ? "green" : ""
        }`}
      >
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function AssessmentRow({
  item,
  onClick,
}) {
  return (
    <button
      className="assessment-row"
      onClick={onClick}
    >
      <div className="assessment-row-icon">
        🛡️
      </div>

      <div className="assessment-row-info">
        <strong>{item.projectName}</strong>
        <span>
          {formatDate(item.createdAt)}
        </span>
      </div>

      <div className="assessment-row-score">
        <strong>
          {item.overallScore}/100
        </strong>

        <RiskLevelBadge
          level={item.overallLevel}
        />
      </div>

      <span className="arrow">→</span>
    </button>
  );
}

function RiskCard({ risk }) {
  const score = Number(risk.score || 0);

  return (
    <div className="risk-card">
      <div className="risk-card-top">
        <div>
          <h3>{risk.name}</h3>

          <RiskLevelBadge
            level={risk.level}
          />
        </div>

        <div className="risk-score">
          <strong>{score}</strong>
          <span>/100</span>
        </div>
      </div>

      <div className="risk-progress">
        <div
          className="risk-progress-fill"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, score)
            )}%`,
          }}
        ></div>
      </div>

      <p className="risk-description">
        {risk.description}
      </p>

      <div className="risk-meta">
        <div>
          <span>Impact</span>
          <strong>{risk.impact}</strong>
        </div>

        <div>
          <span>Likelihood</span>
          <strong>{risk.likelihood}</strong>
        </div>
      </div>

      <div className="recommendation">
        <strong>💡 Recommended Action</strong>
        <p>{risk.recommendedAction}</p>
      </div>
    </div>
  );
}

function RiskLevelBadge({ level }) {
  const normalized = String(
    level || "Medium"
  ).toLowerCase();

  return (
    <span
      className={`risk-badge ${normalized}`}
    >
      {level || "Medium"} Risk
    </span>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
}) {
  return (
    <label className="input-group">
      <span>{label}</span>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

function TextArea({
  label,
  placeholder,
  value,
  onChange,
}) {
  return (
    <label className="input-group">
      <span>{label}</span>

      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
      />
    </label>
  );
}

function EmptyState({
  title,
  text,
  buttonText,
  onClick,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◈</div>

      <h3>{title}</h3>

      <p>{text}</p>

      {buttonText && onClick && (
        <button
          className="primary-button"
          onClick={onClick}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default App;