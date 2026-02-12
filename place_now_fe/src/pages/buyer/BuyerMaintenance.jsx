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

function normalizeStr(v) {
  return String(v ?? "").toLowerCase();
}

function reservationOptionLabel(r) {
  const title = r?.property?.title || "Property";
  const city = r?.property?.city ? ` • ${r.property.city}` : "";
  const start = r?.start_date ? formatDate(r.start_date) : "-";
  const end = r?.end_date ? formatDate(r.end_date) : "-";
  return `${title}${city} — ${start} → ${end}`;
}

const PRIORITY_OPTIONS = ["low", "medium", "high"];
const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

export default function BuyerMaintenance() {
  const me = useMemo(() => getSessionUser(), []);
  const role = me?.role;

  // maintenance list
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // reservations for dropdown
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // UI states
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // create form
  const [creating, setCreating] = useState(false);
  const [useManualPropertyId, setUseManualPropertyId] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [manualPropertyId, setManualPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      // GET /api/buyer/maintenance-requests
      const res = await api.get("/api/buyer/maintenance-requests");
      const list = extractListPayload(res?.data);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "Failed to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReservations() {
    setReservationsLoading(true);
    setError("");
    try {
      // Used only for dropdown UX: GET /api/buyer/reservations
      const res = await api.get("/api/buyer/reservations");
      const list = extractListPayload(res?.data);
      const arr = Array.isArray(list) ? list : [];

      // sort by start_date desc
      arr.sort((a, b) => {
        const da = new Date(a?.start_date || 0).getTime();
        const db = new Date(b?.start_date || 0).getTime();
        return db - da;
      });

      setReservations(arr);

      // preselect the first reservation if none selected
      if (arr.length > 0 && !selectedReservationId) {
        setSelectedReservationId(String(arr[0]?.id || ""));
      }

      // if no reservations, allow manual property id
      if (arr.length === 0) setUseManualPropertyId(true);
    } catch (e) {
      // If this fails, we still allow manual property id entry
      setReservations([]);
      setUseManualPropertyId(true);
      setError(
        e?.response?.data?.message ||
          "Could not load reservations for dropdown. You can still create a request by entering Property ID manually."
      );
    } finally {
      setReservationsLoading(false);
    }
  }

  useEffect(() => {
    if (!me) return;
    if (role !== "buyer") return;
    loadRequests();
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPropertyIdForCreate() {
    if (useManualPropertyId) return String(manualPropertyId || "").trim();

    const rid = String(selectedReservationId || "").trim();
    if (!rid) return "";
    const r = reservations.find((x) => String(x?.id) === rid);
    // reservation payload should include property_id; fallback to property.id
    return String(r?.property_id ?? r?.property?.id ?? "").trim();
  }

  async function createRequest() {
    if (role !== "buyer") return;

    const propertyId = getPropertyIdForCreate();
    if (!propertyId) {
      setError("Property is required.");
      return;
    }
    if (!String(title || "").trim()) {
      setError("Title is required.");
      return;
    }
    if (!String(description || "").trim()) {
      setError("Description is required.");
      return;
    }
    if (!PRIORITY_OPTIONS.includes(priority)) {
      setError("Invalid priority.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      // POST /api/properties/{property}/maintenance-requests
      await api.post(`/api/properties/${propertyId}/maintenance-requests`, {
        title,
        description,
        priority,
      });

      // reset form (keep property selection)
      setTitle("");
      setDescription("");
      setPriority("medium");
      setManualPropertyId("");

      await loadRequests();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create maintenance request.");
    } finally {
      setCreating(false);
    }
  }

  const summary = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    for (const it of items) {
      if (c[it?.status] !== undefined) c[it.status] += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const s = normalizeStr(search);

    return items
      .filter((it) => (statusFilter === "all" ? true : it?.status === statusFilter))
      .filter((it) => {
        if (!s) return true;

        const hay = [
          it?.id,
          it?.title,
          it?.description,
          it?.priority,
          it?.status,
          it?.property_id,
          it?.property?.title,
          it?.property?.city,
          it?.property?.address,
        ]
          .map(normalizeStr)
          .join(" ");

        return hay.includes(s);
      });
  }, [items, statusFilter, search]);

  const tableCols = "0.6fr 1.2fr 1.6fr 0.8fr 1fr 0.9fr 1fr";

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Maintenance Requests</h1>
          <p className="page-subtitle">
            Create and track maintenance requests for properties you’ve reserved.
          </p>
        </div>

        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            loadRequests();
            loadReservations();
          }}
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
          <div className="schema-head">Open</div>
          <div className="schema-body">
            <div className="schema-row">
              <span className="schema-pill">open</span>
              <div className="strong">{summary.open}</div>
            </div>
            <div className="schema-row">
              <span className="schema-pill">in progress</span>
              <div className="strong">{summary.in_progress}</div>
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Resolved</div>
          <div className="schema-body">
            <div className="schema-row">
              <span className="schema-pill">resolved</span>
              <div className="strong">{summary.resolved}</div>
            </div>
            <div className="schema-row">
              <span className="schema-pill">closed</span>
              <div className="strong">{summary.closed}</div>
            </div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">Backend rules</div>
          <div className="schema-body">
            <div className="note">
              Backend will allow creation only if you have an active or recently ended reservation
              for that property (and the reservation is not cancelled).
            </div>
          </div>
        </div>
      </div>

      {/* Create */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Create maintenance request</div>

        <div className="form">
          <div className="form-row">
            <div className="field" style={{ minWidth: 280 }}>
              <label>Property (from your reservations)</label>

              {!useManualPropertyId ? (
                <select
                  className="input"
                  value={selectedReservationId}
                  onChange={(e) => setSelectedReservationId(e.target.value)}
                  disabled={reservationsLoading || reservations.length === 0 || role !== "buyer"}
                >
                  {reservationsLoading ? (
                    <option value="">Loading reservations...</option>
                  ) : reservations.length === 0 ? (
                    <option value="">No reservations available</option>
                  ) : (
                    reservations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {reservationOptionLabel(r)}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <input
                  className="input"
                  value={manualPropertyId}
                  onChange={(e) => setManualPropertyId(e.target.value)}
                  placeholder="Enter Property ID (fallback)"
                  disabled={role !== "buyer"}
                />
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={loadReservations}
                  disabled={reservationsLoading || role !== "buyer"}
                  style={{ padding: "8px 12px" }}
                >
                  {reservationsLoading ? "Loading..." : "Reload reservations"}
                </button>

                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={useManualPropertyId}
                    onChange={(e) => setUseManualPropertyId(e.target.checked)}
                    disabled={role !== "buyer"}
                  />
                  Enter Property ID manually
                </label>
              </div>
            </div>

            <div className="field">
              <label>Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={role !== "buyer"}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Heating not working"
              disabled={role !== "buyer"}
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem..."
              disabled={role !== "buyer"}
            />
          </div>

          <div className="actions">
            <button className="btn" type="button" onClick={createRequest} disabled={creating || role !== "buyer"}>
              {creating ? "Creating..." : "Create request"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Requests</div>

        <div className="form-row" style={{ alignItems: "end", marginBottom: 10 }}>
          <div className="field">
            <label>Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, property, city, status..."
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
          <div className="muted">No maintenance requests found.</div>
        ) : (
          <div className="table">
            <div className="row row--head" style={{ gridTemplateColumns: tableCols }}>
              <div>ID</div>
              <div>Property</div>
              <div>Title</div>
              <div>Priority</div>
              <div>Reported</div>
              <div>Status</div>
              <div className="right">Action</div>
            </div>

            {filtered.map((it) => {
              const propTitle = it?.property?.title || `Property #${it?.property_id ?? "-"}`;
              const propCity = it?.property?.city ? ` • ${it.property.city}` : "";

              return (
                <div key={it.id} className="row" style={{ gridTemplateColumns: tableCols }}>
                  <div className="strong">#{it.id}</div>

                  <div>
                    <div className="strong">{propTitle}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {propCity || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="strong">{it.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {it.description
                        ? `${String(it.description).slice(0, 70)}${String(it.description).length > 70 ? "…" : ""}`
                        : "-"}
                    </div>
                  </div>

                  <div>
                    <span className="schema-pill">{it.priority}</span>
                  </div>

                  <div>{formatDateTime(it.reported_at || it.created_at)}</div>

                  <div>
                    <span className={`pill pill--${it.status}`}>
                      {String(it.status || "").replace(/_/g, " ")}
                    </span>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      resolved_at: {formatDateTime(it.resolved_at)}
                    </div>
                  </div>

                  <div className="right">
                    <button className="icon-btn" type="button" onClick={() => setActive(it)}>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details modal */}
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
                  Request #{active.id} • {active.title}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  status: {String(active.status || "").replace(/_/g, " ")} • priority:{" "}
                  {active.priority}
                </div>
              </div>

              <button className="icon-btn" type="button" onClick={() => setActive(null)}>
                Close
              </button>
            </div>

            <div className="modal-body">
              <div className="draft-grid">
                <div className="draft-card">
                  <div className="draft-title">Request</div>
                  <div className="schema-row">
                    <span className="schema-pill">reported</span>
                    <div className="strong">
                      {formatDateTime(active.reported_at || active.created_at)}
                    </div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">resolved</span>
                    <div className="strong">{formatDateTime(active.resolved_at)}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">status</span>
                    <div className="strong">{String(active.status || "").replace(/_/g, " ")}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">priority</span>
                    <div className="strong">{active.priority}</div>
                  </div>
                </div>

                <div className="draft-card">
                  <div className="draft-title">Property</div>
                  <div className="schema-row">
                    <span className="schema-pill">title</span>
                    <div className="strong">{active.property?.title || "-"}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">city</span>
                    <div className="strong">{active.property?.city || "-"}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">address</span>
                    <div className="strong">{active.property?.address || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-title">Description</div>
                <div style={{ whiteSpace: "pre-wrap", fontWeight: 800, color: "rgba(11,27,43,0.85)" }}>
                  {active.description || "-"}
                </div>
              </div>

              <div className="note" style={{ marginTop: 12 }}>
                Buyers can create and view requests. Status updates are handled by seller/admin on
                their Maintenance page.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
