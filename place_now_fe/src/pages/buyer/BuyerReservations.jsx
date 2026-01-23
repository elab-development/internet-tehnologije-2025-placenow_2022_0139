import { useEffect, useState } from "react";
import { FiRefreshCw, FiXCircle } from "react-icons/fi";
import api from "../../api/axios";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function canCancel(reservation) {
  if (!reservation?.start_date) return false;
  const start = new Date(reservation.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (reservation.status === "pending" || reservation.status === "confirmed") && start > today;
}

export default function BuyerReservations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/buyer/reservations");
      setItems(res?.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    if (!window.confirm("Cancel this reservation?")) return;

    setError("");
    try {
      await api.patch(`/api/reservations/${id}/cancel`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel reservation.");
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">Your reservations and statuses.</p>
        </div>

        <button className="btn-secondary" onClick={load}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="card">
        <div className="card-title">My Reservations</div>

        {error ? <div className="alert">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="muted">No reservations found.</div>
        ) : (
          <div className="table">
            <div className="row row--head" style={{ gridTemplateColumns: "0.6fr 1.6fr 1.4fr 0.9fr 0.9fr 1.2fr" }}>
              <div>Property</div>
              <div>Dates</div>
              <div>Guests</div>
              <div>Total</div>
              <div className="right">Action</div>
            </div>

            {items.map((r) => (
              <div key={r.id} className="row" style={{ gridTemplateColumns: "0.6fr 1.6fr 1.4fr 0.9fr 0.9fr 1.2fr" }}>
                <div>
                  <div className="strong">{r.property?.title || "Property"}</div>
                  <div className="muted">{r.property?.city || ""}</div>
                </div>

                <div>
                  <span className="date-chip">{formatDate(r.start_date)}</span>
                  <span style={{ margin: "0 8px", color: "#6b7c93" }}>→</span>
                  <span className="date-chip">{formatDate(r.end_date)}</span>
                </div>

                <div>{r.guests}</div>
                <div>€ {r.total_price}</div>

                <div className="right">
                  <span className={`pill pill--${r.status}`} style={{ marginRight: 10 }}>
                    {r.status}
                  </span>

                  <button className="btn-ghost" disabled={!canCancel(r)} onClick={() => cancel(r.id)}>
                    <FiXCircle /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
