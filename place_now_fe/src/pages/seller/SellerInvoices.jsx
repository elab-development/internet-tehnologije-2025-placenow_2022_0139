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
  // Handles: {data:[...]}, {data:{data:[...]}}, or direct array
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

function reservationLabel(r) {
  const title = r?.property?.title || "Property";
  const start = formatDate(r?.start_date);
  const end = formatDate(r?.end_date);
  const city = r?.property?.city ? ` • ${r.property.city}` : "";
  return `${title}${city} — ${start} → ${end}`;
}

const STATUS_OPTIONS = ["unpaid", "overdue", "paid"];

export default function SellerInvoices() {
  const me = useMemo(() => getSessionUser(), []);
  const role = me?.role;
  const canManage = role === "seller" || role === "admin";
  const isBuyer = role === "buyer";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // modal
  const [active, setActive] = useState(null);

  // reservations (for seller dropdown)
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState("");

  // seller/admin create form (POST /reservations/{reservation}/invoices)
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [manualReservationId, setManualReservationId] = useState("");
  const [useManualReservationId, setUseManualReservationId] = useState(false);

  const [createAmount, setCreateAmount] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // buyer pay action (POST /buyer/invoices/{invoice}/pay)
  const [payingId, setPayingId] = useState(null);

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      // invoice routes from api.php:
      // - GET /invoices (seller/admin)
      // - GET /buyer/invoices (buyer)
      const url = isBuyer ? "/api/buyer/invoices" : "/api/invoices";
      const res = await api.get(url);

      const list = extractListPayload(res?.data);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReservationsForDropdown() {
    if (!canManage) return;
    setReservationsLoading(true);
    setReservationsError("");

    try {
      // Used only for the dropdown: GET /seller/reservations
      const res = await api.get("/api/seller/reservations");
      const list = extractListPayload(res?.data);
      const arr = Array.isArray(list) ? list : [];

      // Sort by start_date desc (optional)
      arr.sort((a, b) => {
        const da = new Date(a?.start_date || 0).getTime();
        const db = new Date(b?.start_date || 0).getTime();
        return db - da;
      });

      setReservations(arr);

      // If we have reservations, prefer dropdown mode
      if (arr.length > 0) {
        setUseManualReservationId(false);
        // preselect first one if none selected
        if (!selectedReservationId) setSelectedReservationId(String(arr[0]?.id || ""));
      } else {
        // If none, allow manual
        setUseManualReservationId(true);
      }
    } catch (e) {
      // Admin may get 403 here depending on your backend rule; allow manual fallback
      setReservations([]);
      setReservationsError(
        e?.response?.data?.message ||
          "Could not load reservations for dropdown. You can still enter Reservation ID manually."
      );
      setUseManualReservationId(true);
    } finally {
      setReservationsLoading(false);
    }
  }

  useEffect(() => {
    if (!me || !(canManage || isBuyer)) return;
    loadInvoices();
    if (canManage) loadReservationsForDropdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createInvoice() {
    if (!canManage) return;

    const rid = useManualReservationId
      ? String(manualReservationId || "").trim()
      : String(selectedReservationId || "").trim();

    if (!rid) {
      setError("Reservation is required.");
      return;
    }

    const amountNum = Number(createAmount);
    if (!createAmount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    if (!createDueDate) {
      setError("Due date is required.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      // POST /reservations/{reservation}/invoices
      await api.post(`/api/reservations/${rid}/invoices`, {
        amount: amountNum,
        due_date: createDueDate,
        description: createDescription,
      });

      setCreateAmount("");
      setCreateDueDate("");
      setCreateDescription("");

      // don’t clear selected reservation; keep UX nice
      setManualReservationId("");

      await loadInvoices();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create invoice.");
    } finally {
      setCreating(false);
    }
  }

  async function payInvoice(invoiceId) {
    if (!isBuyer) return;

    setPayingId(invoiceId);
    setError("");

    try {
      // POST /buyer/invoices/{invoice}/pay
      await api.post(`/api/buyer/invoices/${invoiceId}/pay`);
      await loadInvoices();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to pay invoice.");
    } finally {
      setPayingId(null);
    }
  }

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

  const summary = useMemo(() => {
    const res = {
      unpaid: 0,
      overdue: 0,
      paid: 0,
      totalOutstanding: 0,
      totalPaid: 0,
    };

    for (const it of items) {
      if (it?.status === "unpaid") res.unpaid += 1;
      if (it?.status === "overdue") res.overdue += 1;
      if (it?.status === "paid") res.paid += 1;

      const amt = Number(it?.amount ?? 0) || 0;
      if (it?.status === "paid") res.totalPaid += amt;
      if (it?.status === "unpaid" || it?.status === "overdue") res.totalOutstanding += amt;
    }

    return res;
  }, [items]);

  const tableCols = canManage
    ? "0.6fr 1fr 1.4fr 0.9fr 0.9fr 0.9fr 1fr"
    : "0.6fr 1fr 1.6fr 0.9fr 0.9fr 0.9fr 1fr";

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">
            {canManage
              ? "Seller/Admin: view issued invoices and create new ones for reservations."
              : isBuyer
                ? "Buyer: view your invoices and pay unpaid/overdue."
                : "Sign in to view invoices."}
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => {
            loadInvoices();
            if (canManage) loadReservationsForDropdown();
          }}
          type="button"
          disabled={loading || !(canManage || isBuyer)}
        >
          Refresh
        </button>
      </div>

      {!me ? <div className="alert">You are not logged in.</div> : null}
      {me && !canManage && !isBuyer ? (
        <div className="alert">Nemate dozvolu. Samo seller/admin ili buyer.</div>
      ) : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="grid-3">
        <div className="schema-card">
          <div className="schema-head">Open (unpaid)</div>
          <div className="schema-body">
            <div className="schema-row">
              <span className="schema-pill">count</span>
              <div className="strong">{summary.unpaid}</div>
            </div>
            <div className="schema-row">
              <span className="schema-pill">outstanding</span>
              <div className="strong">€ {formatMoney(summary.totalOutstanding)}</div>
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Overdue</div>
          <div className="schema-body">
            <div className="schema-row">
              <span className="schema-pill">count</span>
              <div className="strong">{summary.overdue}</div>
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
      </div>

      {canManage ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Create invoice (seller/admin)</div>

          {reservationsError ? <div className="alert">{reservationsError}</div> : null}

          <div className="form">
            <div className="form-row">
              <div className="field" style={{ minWidth: 260 }}>
                <label>Reservation</label>

                {!useManualReservationId ? (
                  <select
                    className="input"
                    value={selectedReservationId}
                    onChange={(e) => setSelectedReservationId(e.target.value)}
                    disabled={reservationsLoading || reservations.length === 0}
                  >
                    {reservationsLoading ? (
                      <option value="">Loading reservations...</option>
                    ) : reservations.length === 0 ? (
                      <option value="">No reservations available</option>
                    ) : (
                      reservations.map((r) => (
                        <option key={r.id} value={r.id}>
                          {reservationLabel(r)}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <input
                    className="input"
                    value={manualReservationId}
                    onChange={(e) => setManualReservationId(e.target.value)}
                    placeholder="Enter Reservation ID (fallback)"
                  />
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={loadReservationsForDropdown}
                    disabled={reservationsLoading}
                    style={{ padding: "8px 12px" }}
                  >
                    {reservationsLoading ? "Loading..." : "Reload reservations"}
                  </button>

                  <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={useManualReservationId}
                      onChange={(e) => setUseManualReservationId(e.target.checked)}
                    />
                    Enter ID manually
                  </label>
                </div>
              </div>

              <div className="field">
                <label>Amount</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                  placeholder="e.g. 120.00"
                />
              </div>

              <div className="field">
                <label>Due date</label>
                <input
                  className="input"
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Description (optional)</label>
              <input
                className="input"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="e.g. Cleaning fee"
              />
            </div>

            <div className="actions">
              <button className="btn" type="button" onClick={createInvoice} disabled={creating}>
                {creating ? "Creating..." : "Create invoice"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Invoice list</div>

        <div className="form-row" style={{ alignItems: "end", marginBottom: 10 }}>
          <div className="field">
            <label>Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by id, reservation, property, description..."
            />
          </div>

          <div className="field">
            <label>Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <div>Description</div>
              <div>Amount</div>
              <div>Due</div>
              <div>Status</div>
              <div className="right">Action</div>
            </div>

            {filtered.map((it) => {
              const canPay = isBuyer && (it.status === "unpaid" || it.status === "overdue");
              const resId = it.reservation?.id ?? it.reservation_id ?? "-";
              const propTitle = it.reservation?.property?.title;
              const propCity = it.reservation?.property?.city;

              return (
                <div key={it.id} className="row" style={{ gridTemplateColumns: tableCols }}>
                  <div className="strong">#{it.id}</div>

                  <div>
                    <div className="strong">#{resId}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {propTitle ? propTitle : "Reservation"}
                      {propCity ? ` • ${propCity}` : ""}
                    </div>
                  </div>

                  <div>
                    <div className="strong">{it.description || "-"}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      paid_at: {formatDateTime(it.paid_at)}
                    </div>
                  </div>

                  <div>€ {formatMoney(it.amount)}</div>
                  <div>{formatDate(it.due_date)}</div>

                  <div>
                    <span className={`pill pill--${it.status}`}>
                      {String(it.status || "").replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="right" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="icon-btn" type="button" onClick={() => setActive(it)} title="View details">
                      View
                    </button>

                    {canPay ? (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => payInvoice(it.id)}
                        disabled={payingId === it.id}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <div className="modal-title">
                  Invoice #{active.id} • € {formatMoney(active.amount)}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  status: {String(active.status || "").replace(/_/g, " ")} • due: {formatDate(active.due_date)}
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

              {isBuyer && (active.status === "unpaid" || active.status === "overdue") ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card-title">Pay invoice</div>
                  <div className="actions">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => payInvoice(active.id)}
                      disabled={payingId === active.id}
                    >
                      {payingId === active.id ? "Paying..." : "Pay now"}
                    </button>
                  </div>
                  <div className="note">
                    Uses <b>POST /buyer/invoices/:invoice/pay</b>. Backend will set <b>paid_at</b> and mark it as <b>paid</b>.
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
