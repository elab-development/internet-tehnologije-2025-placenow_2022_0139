import { useEffect, useMemo, useRef, useState } from "react";
import { FiBarChart2, FiPlay } from "react-icons/fi";
import api from "../../api/axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function monthLabel(yyyyMm) {
  if (!yyyyMm || typeof yyyyMm !== "string") return String(yyyyMm || "");
  const [y, m] = yyyyMm.split("-").map((x) => Number(x));
  if (!y || !m) return yyyyMm;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function AdminMetrics() {
  const me = useMemo(() => getSessionUser(), []);
  const isAdmin = me?.role === "admin";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  //  prevents double-load in StrictMode dev
  const didAutoLoadRef = useRef(false);

  async function loadSummary() {
    if (!isAdmin) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/api/admin/metrics/summary");
      setSummary(res?.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Ne mogu da učitam metrics summary.");
    } finally {
      setLoading(false);
    }
  }

  //  Auto-load on first mount
  useEffect(() => {
    if (!isAdmin) return;
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const revenueRows = useMemo(() => {
    const rows = Array.isArray(summary?.revenue_by_month) ? summary.revenue_by_month : [];
    return rows.map((r) => ({
      month: r?.month,
      revenue: Number(r?.revenue ?? 0) || 0,
    }));
  }, [summary]);

  const revenueLabels = useMemo(
    () => revenueRows.map((r) => monthLabel(r.month)),
    [revenueRows]
  );

  const revenueValues = useMemo(
    () => revenueRows.map((r) => r.revenue),
    [revenueRows]
  );

  const kpiBarData = useMemo(() => {
    if (!summary) return null;
    return {
      labels: ["Total reservations", "Active properties", "Open maintenance"],
      datasets: [
        {
          label: "Count",
          data: [
            Number(summary.total_reservations ?? 0) || 0,
            Number(summary.active_properties ?? 0) || 0,
            Number(summary.open_maintenance_requests ?? 0) || 0,
          ],
        },
      ],
    };
  }, [summary]);

  const revenueLineData = useMemo(() => {
    if (!summary) return null;
    return {
      labels: revenueLabels,
      datasets: [
        {
          label: "Paid revenue",
          data: revenueValues,
          tension: 0.25,
          pointRadius: 3,
        },
      ],
    };
  }, [summary, revenueLabels, revenueValues]);

  const commonOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: false },
      },
    }),
    []
  );

  const revenueOptions = useMemo(
    () => ({
      ...commonOptions,
      scales: {
        y: {
          ticks: {
            callback: (v) => `€ ${v}`,
          },
        },
      },
    }),
    [commonOptions]
  );

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <FiBarChart2 /> Admin Metrics
          </h1>
        </div>

        {/* still keep manual reload */}
        <button className="btn" type="button" onClick={loadSummary} disabled={loading || !isAdmin}>
          <FiPlay /> {loading ? "Loading..." : "Reload"}
        </button>
      </div>

      {!isAdmin ? (
        <div className="alert">Nemate dozvolu. Samo admin može da vidi ovu stranicu.</div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      <div className="grid-3">
        <div className="schema-card">
          <div className="schema-head">Total reservations</div>
          <div className="schema-body">
            <div className="strong" style={{ fontSize: 28 }}>
              {summary ? summary.total_reservations : "—"}
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Active properties</div>
          <div className="schema-body">
            <div className="strong" style={{ fontSize: 28 }}>
              {summary ? summary.active_properties : "—"}
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Open maintenance</div>
          <div className="schema-body">
            <div className="strong" style={{ fontSize: 28 }}>
              {summary ? summary.open_maintenance_requests : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-title">KPIs (bar chart)</div>
          {!summary ? (
            <div className="muted">Loading summary...</div>
          ) : (
            <div style={{ height: 320 }}>
              <Bar data={kpiBarData} options={commonOptions} />
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Revenue by month (line chart)</div>
          {!summary ? (
            <div className="muted">Loading summary...</div>
          ) : revenueRows.length === 0 ? (
            <div className="muted">No paid revenue yet.</div>
          ) : (
            <div style={{ height: 320 }}>
              <Line data={revenueLineData} options={revenueOptions} />
            </div>
          )}
        </div>
      </div>

      {summary ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Revenue rows</div>
          {revenueRows.length === 0 ? (
            <div className="muted">No rows.</div>
          ) : (
            <div className="table">
              <div className="row row--head" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>Month</div>
                <div>Revenue</div>
              </div>
              {revenueRows.map((r) => (
                <div key={r.month} className="row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="strong">{monthLabel(r.month)}</div>
                  <div>€ {Number(r.revenue ?? 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
