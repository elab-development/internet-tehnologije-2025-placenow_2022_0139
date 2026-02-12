import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extractListPayload(payload) {
  // Supports: {data:[...]}, {data:{data:[...]}}, or direct array
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
}

function formatMoney(v) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function invoiceReservationLabel(inv) {
  const r = inv?.reservation;
  const prop = r?.property;

  const title = prop?.title || "Reservation";
  const city = prop?.city ? ` • ${prop.city}` : "";
  const start = r?.start_date ? formatDate(r.start_date) : null;
  const end = r?.end_date ? formatDate(r.end_date) : null;

  if (start && end) return `${title}${city} — ${start} → ${end}`;
  if (r?.id || inv?.reservation_id) return `${title}${city} — #${r?.id ?? inv?.reservation_id}`;
  return `${title}${city}`;
}

const STATUS_OPTIONS = ["unpaid", "overdue", "paid"];

export default function BuyerInvoices() {
  const me = useMemo(() => getSessionUser(), []);
  const role = me?.role;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // modal
  const [active, setActive] = useState(null);

  // pay state
  const [payingId, setPayingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      // Buyer invoices route:
      // GET /api/buyer/invoices
      const res = await api.get("/api/buyer/invoices");
      const list = extractListPayload(res?.data);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) return;
    if (role !== "buyer") return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function payInvoice(invoiceId) {
    if (role !== "buyer") return;

    setPayingId(invoiceId);
    setError("");

    try {
      // Pay route:
      // POST /api/buyer/invoices/{invoice}/pay
      await api.post(`/api/buyer/invoices/${invoiceId}/pay`);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to pay invoice.");
    } finally {
      setPayingId(null);
    }
  }

  const summary = useMemo(() => {
    const res = {
      unpaid: 0,
      overdue: 0,
      paid: 0,
      totalOutstanding: 0,
      totalPaid: 0,
    };

    for (const it of items) {
      const amt = Number(it?.amount ?? 0) || 0;

      if (it?.status === "unpaid") {
        res.unpaid += 1;
        res.totalOutstanding += amt;
      }
      if (it?.status === "overdue") {
        res.overdue += 1;
        res.totalOutstanding += amt;
      }
      if (it?.status === "paid") {
        res.paid += 1;
        res.totalPaid += amt;
      }
    }

    return res;
  }, [items]);

  const filtered = useMemo(() => {
    const s = String(search || "").toLowerCase();

    return items
      .filter((it) => (statusFilter === "all" ? true : it.status === statusFilter))
      .filter((it) => {
        if (!s) return true;

        const hay = [
          it.id,
          it.status,
          it.amount,
          it.description,
          it.due_date,
          it.paid_at,
          it.reservation_id,
          it.reservation?.id,
          it.reservation?.property?.title,
          it.reservation?.property?.city,
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" ");

        return hay.includes(s);
      });
  }, [items, statusFilter, search]);

  const tableCols = "0.6fr 1.6fr 0.9fr 0.9fr 0.9fr 1.1fr";

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Invoices</h1>
          <p className="page-subtitle">View and pay your invoices.</p>
        </div>

        <button
          className="btn-secondary"
          onClick={load}
          type="button"
          disabled={loading || role !== "buyer"}
        >
          Refresh
        </button>
      </div>

      {!me ? <div className="alert">You are not logged in.</div> : null}
      {me && role !== "buyer" ? (
        <div className="alert">Nemate dozvolu. Ova stranica je samo za buyer korisnike.</div>
      ) : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="grid-3">
        <div className="schema-card">
          <div className="schema-head">Outstanding</div>
          <div className="schema-body">
            <div className="schema-row">
              <span className="schema-pill">unpaid</span>
              <div className="strong">{summary.unpaid}</div>
            </div>
            <div className="schema-row">
              <span className="schema-pill">overdue</span>
              <div className="strong">{summary.overdue}</div>
            </div>
            <div className="schema-row">
              <span className="schema-pill">total</span>
              <div className="strong">€ {formatMoney(summary.totalOutstanding)}</div>
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Paid</div>
          <div className="schema-body">
            <div className="schema-row">
              <span className="schema-pill">count</span>
              <div className="strong">{summary.paid}</div>
            </div>
            <div className="schema-row">
              <span className="schema-pill">total</span>
              <div className="strong">€ {formatMoney(summary.totalPaid)}</div>
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Tip</div>
          <div className="schema-body">
            <div className="note">
              You can pay invoices only when status is <b>unpaid</b> or <b>overdue</b>.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Invoice list</div>

        <div className="form-row" style={{ alignItems: "end", marginBottom: 10 }}>
          <div className="field">
            <label>Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by property, city, description, status..."
              disabled={role !== "buyer"}
            />
          </div>

          <div className="field">
            <label>Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={role !== "buyer"}
            >
              <option value="all">all</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No invoices found.</div>
        ) : (
          <div className="table">
            <div className="row row--head" style={{ gridTemplateColumns: tableCols }}>
              <div>ID</div>
              <div>Reservation</div>
              <div>Amount</div>
              <div>Due</div>
              <div>Status</div>
              <div className="right">Action</div>
            </div>

            {filtered.map((it) => {
              const canPay = it.status === "unpaid" || it.status === "overdue";

              return (
                <div key={it.id} className="row" style={{ gridTemplateColumns: tableCols }}>
                  <div className="strong">#{it.id}</div>

                  <div>
                    <div className="strong">{invoiceReservationLabel(it)}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {it.description ? it.description : "—"}
                    </div>
                  </div>

                  <div>€ {formatMoney(it.amount)}</div>
                  <div>{formatDate(it.due_date)}</div>

                  <div>
                    <span className={`pill pill--${it.status}`}>
                      {String(it.status || "").replace(/_/g, " ")}
                    </span>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      paid_at: {formatDateTime(it.paid_at)}
                    </div>
                  </div>

                  <div
                    className="right"
                    style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
                  >
                    <button className="icon-btn" type="button" onClick={() => setActive(it)}>
                      View
                    </button>

                    {canPay ? (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => payInvoice(it.id)}
                        disabled={payingId === it.id || role !== "buyer"}
                        style={{ padding: "8px 12px" }}
                      >
                        {payingId === it.id ? "Paying..." : "Pay"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {active ? (
        <div className="modal-backdrop" onClick={() => setActive(null)} role="presentation">
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-head">
              <div>
                <div className="modal-title">
                  Invoice #{active.id} • € {formatMoney(active.amount)}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  status: {String(active.status || "").replace(/_/g, " ")} • due:{" "}
                  {formatDate(active.due_date)}
                </div>
              </div>

              <button className="icon-btn" type="button" onClick={() => setActive(null)}>
                Close
              </button>
            </div>

            <div className="modal-body">
              <div className="draft-grid">
                <div className="draft-card">
                  <div className="draft-title">Invoice</div>
                  <div className="schema-row">
                    <span className="schema-pill">id</span>
                    <div className="strong">#{active.id}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">amount</span>
                    <div className="strong">€ {formatMoney(active.amount)}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">status</span>
                    <div className="strong">{String(active.status || "").replace(/_/g, " ")}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">due_date</span>
                    <div className="strong">{formatDate(active.due_date)}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">paid_at</span>
                    <div className="strong">{formatDateTime(active.paid_at)}</div>
                  </div>
                </div>

                <div className="draft-card">
                  <div className="draft-title">Reservation / Property</div>
                  <div className="schema-row">
                    <span className="schema-pill">reservation</span>
                    <div className="strong">#{active.reservation?.id ?? active.reservation_id ?? "-"}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">property</span>
                    <div className="strong">{active.reservation?.property?.title || "-"}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">city</span>
                    <div className="strong">{active.reservation?.property?.city || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-title">Description</div>
                <div style={{ whiteSpace: "pre-wrap", fontWeight: 800, color: "rgba(11,27,43,0.85)" }}>
                  {active.description || "-"}
                </div>
              </div>

              {(active.status === "unpaid" || active.status === "overdue") ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card-title">Pay invoice</div>
                  <div className="actions">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => payInvoice(active.id)}
                      disabled={payingId === active.id || role !== "buyer"}
                    >
                      {payingId === active.id ? "Paying..." : "Pay now"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
