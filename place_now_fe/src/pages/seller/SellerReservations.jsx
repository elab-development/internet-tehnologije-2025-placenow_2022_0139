import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import api from "../../api/axios";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  // npr. 01 Mar 2026
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SellerReservations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/seller/reservations");
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

  async function changeStatus(id, status) {
    setError("");
    try {
      await api.patch(`/api/seller/reservations/${id}/status`, { status });
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update status.");
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Reservations</h1>
        </div>

        <button className="btn-secondary" onClick={load}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="card">
        <div className="card-title">Seller Reservations</div>

        {error ? <div className="alert">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="muted">No reservations found.</div>
        ) : (
          <div className="table">
            <div
              className="row row--head"
              style={{ gridTemplateColumns: "0.6fr 1.4fr 1.3fr 0.8fr 0.9fr 0.9fr 1.1fr" }}
            >
              <div>ID</div>
              <div>Property</div>
              <div>Dates</div>
              <div>Guests</div>
              <div>Total</div>
              <div>Status</div>
              <div className="right">Update</div>
            </div>

            {items.map((r) => (
              <div
                key={r.id}
                className="row"
                style={{ gridTemplateColumns: "0.6fr 1.4fr 1.3fr 0.8fr 0.9fr 0.9fr 1.1fr" }}
              >
                <div className="strong">#{r.id}</div>
                <div className="strong">{r.property?.title || "Property"}</div>

                <div>
                  <span className="date-chip">{formatDate(r.start_date)}</span>
                  <span style={{ margin: "0 8px", color: "#6b7c93" }}>→</span>
                  <span className="date-chip">{formatDate(r.end_date)}</span>
                </div>

                <div>{r.guests}</div>
                <div>€ {r.total_price}</div>
                <div>
                  <span className={`pill pill--${r.status}`}>{r.status}</span>
                </div>
                <div className="right">
                  <select
                    className="input small"
                    value={r.status}
                    onChange={(e) => changeStatus(r.id, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
