import { useMemo, useState } from "react";
import { FiFileText, FiSearch } from "react-icons/fi";
import api from "../../api/axios";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatMoney(value) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(2);
}

export default function AdminReports() {
  const me = useMemo(() => getSessionUser(), []);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [report, setReport] = useState(null);

  async function runReport(e) {
    e?.preventDefault?.();
    setError("");
    setReport(null);

    if (!dateFrom || !dateTo) {
      setError("Izaberi date_from i date_to.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/admin/reports", {
        params: { date_from: dateFrom, date_to: dateTo },
      });

      // AdminMetricsController::report -> { success:true, data:{ period, paid_revenue, reservations } }
      setReport(res?.data?.data || null);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Ne mogu da generišem report.");
    } finally {
      setLoading(false);
    }
  }

  const reservations = Array.isArray(report?.reservations) ? report.reservations : [];

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <FiFileText /> Admin Reports
          </h1>
        
        </div>
      </div>

      {me?.role !== "admin" ? (
        <div className="alert">Nemate dozvolu. Samo admin može da vidi ovu stranicu.</div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <div className="card-title">Report filters</div>

        <form className="filter-row" onSubmit={runReport}>
          <div className="filter-item">
            <label className="muted" style={{ marginBottom: 6, display: "block" }}>
              Date from
            </label>
            <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="filter-item">
            <label className="muted" style={{ marginBottom: 6, display: "block" }}>
              Date to
            </label>
            <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            <FiSearch /> {loading ? "Generating..." : "Generate"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Results</div>

        {!report ? (
          <div className="muted">No data.</div>
        ) : (
          <>
            <div className="details-top" style={{ marginBottom: 10 }}>
              <div>
                <div className="details-sub">
                  <b>Period:</b> {report?.period?.date_from} → {report?.period?.date_to}
                </div>
                <div className="details-sub">
                  <b>Paid revenue:</b> € {formatMoney(report?.paid_revenue)}
                </div>
                <div className="details-sub">
                  <b>Reservations:</b> {reservations.length}
                </div>
              </div>
            </div>

            {reservations.length === 0 ? (
              <div className="muted">Nema rezervacija u tom periodu.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10 }}>ID</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Property</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Start</th>
                      <th style={{ textAlign: "left", padding: 10 }}>End</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Status</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Total</th>
                      <th style={{ textAlign: "left", padding: 10 }}>Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: 10 }}>{r.id}</td>
                        <td style={{ padding: 10 }}>{r?.property?.title || "-"}</td>
                        <td style={{ padding: 10 }}>{r.start_date}</td>
                        <td style={{ padding: 10 }}>{r.end_date}</td>
                        <td style={{ padding: 10 }}>{r.status}</td>
                        <td style={{ padding: 10 }}>€ {formatMoney(r.total_price)}</td>
                        <td style={{ padding: 10 }}>{Array.isArray(r.invoices) ? r.invoices.length : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
