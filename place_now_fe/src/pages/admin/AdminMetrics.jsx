import { useMemo, useState } from "react";
import { FiBarChart2, FiPlay } from "react-icons/fi";
import api from "../../api/axios";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminMetrics() {
  const me = useMemo(() => getSessionUser(), []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Namerno “započeto ali nedovršeno”.
  const [summary, setSummary] = useState(null);

  async function loadSummary() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/api/admin/metrics/summary");
      // summary -> { total_reservations, active_properties, open_maintenance_requests, revenue_by_month }
      setSummary(res?.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Ne mogu da učitam metrics summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <FiBarChart2 /> Admin Metrics
          </h1>
        </div>

        <button className="btn" type="button" onClick={loadSummary} disabled={loading}>
          <FiPlay /> {loading ? "Loading..." : "Load summary"}
        </button>
      </div>

      {me?.role !== "admin" ? (
        <div className="alert">Nemate dozvolu. Samo admin može da vidi ovu stranicu.</div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <div className="card-title">Summary (temporary)</div>

        {!summary ? (
          <div className="muted">No summary loaded.</div>
        ) : (
          <div className="muted">
            <div>Total reservations: {summary.total_reservations}.</div>
            <div>Active properties (available): {summary.active_properties}.</div>
            <div>Open maintenance requests: {summary.open_maintenance_requests}.</div>
            <div>Revenue by month rows: {Array.isArray(summary.revenue_by_month) ? summary.revenue_by_month.length : 0}.</div>
          </div>
        )}
      </div>
    </div>
  );
}
