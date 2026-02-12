import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import api from "../../api/axios";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

function normalizeStr(s) {
  return String(s || "").toLowerCase();
}

export default function SellerMaintenance() {
  const me = useMemo(() => getSessionUser(), []);
  const role = me?.role;
  const canManage = role === "seller" || role === "admin";
  const isBuyer = role === "buyer";

  // shared list state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // seller/admin update state
  const [savingId, setSavingId] = useState(null);

  // buyer create form state (uses POST /properties/{property}/maintenance-requests)
  const [createPropertyId, setCreatePropertyId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPriority, setCreatePriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  // details modal
  const [active, setActive] = useState(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      // Routes from api.php related to maintenance requests:
      // - GET /buyer/maintenance-requests (buyer)
      // - POST /properties/{property}/maintenance-requests (buyer)
      // - GET /maintenance-requests (seller/admin)
      // - PATCH /maintenance-requests/{maintenanceRequest}/status (seller/admin)
      const url = isBuyer ? "/api/buyer/maintenance-requests" : "/api/maintenance-requests";
      const res = await api.get(url);
      setItems(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || "Failed to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function updateStatus(id, nextStatus) {
    if (!canManage) return;
    if (!STATUS_OPTIONS.includes(nextStatus)) return;

    setSavingId(id);
    setError("");

    try {
      await api.patch(`/api/maintenance-requests/${id}/status`, { status: nextStatus });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  }

  async function createRequest() {
    if (!isBuyer) return;
    const propertyId = String(createPropertyId || "").trim();
    if (!propertyId) {
      setError("Property ID is required.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await api.post(`/api/properties/${propertyId}/maintenance-requests`, {
        title: createTitle,
        description: createDescription,
        priority: createPriority,
      });

      // reset form
      setCreateTitle("");
      setCreateDescription("");
      setCreatePriority("medium");
      setCreatePropertyId("");

      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create request.");
    } finally {
      setCreating(false);
    }
  }

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    for (const it of items) {
      if (c[it.status] !== undefined) c[it.status] += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const s = normalizeStr(search);
    return items
      .filter((it) => (statusFilter === "all" ? true : it.status === statusFilter))
      .filter((it) => {
        if (!s) return true;
        const hay = [
          it.id,
          it.title,
          it.description,
          it.priority,
          it.status,
          it.property?.title,
          it.property?.city,
          it.property?.address,
        ]
          .map(normalizeStr)
          .join(" ");
        return hay.includes(s);
      });
  }, [items, statusFilter, search]);

  const topOpen = useMemo(() => items.filter((x) => x.status === "open").slice(0, 3), [items]);
  const topInProgress = useMemo(
    () => items.filter((x) => x.status === "in_progress").slice(0, 3),
    [items],
  );

  const tableCols = canManage
    ? "0.6fr 1.2fr 1.4fr 0.8fr 1fr 0.9fr 1.2fr"
    : "0.6fr 1.2fr 1.6fr 0.8fr 1fr 0.9fr 0.9fr";

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">
            {canManage
              ? "Manage maintenance requests assigned to you (seller/admin)."
              : isBuyer
                ? "Create and track your maintenance requests (buyer)."
                : "Sign in to view maintenance requests."}
          </p>
        </div>

        <button className="btn-secondary" onClick={load} type="button" disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {!me ? <div className="alert">You are not logged in.</div> : null}
      {me && !canManage && !isBuyer ? (
        <div className="alert">Nemate dozvolu. Samo seller/admin ili buyer.</div>
      ) : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="grid-3">
        <div className="schema-card">
          <div className="schema-head">
            <FiAlertCircle /> Open <span className="schema-pill">{counts.open}</span>
          </div>
          <div className="schema-body">
            {loading ? (
              <>
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </>
            ) : topOpen.length === 0 ? (
              <div className="muted">No open requests.</div>
            ) : (
              topOpen.map((it) => (
                <div key={it.id} className="schema-row">
                  <span className="schema-pill">#{it.id}</span>
                  <div style={{ flex: 1 }}>
                    <div className="strong" style={{ fontSize: 13 }}>
                      {it.title}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {it.property?.title || "Property"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">
            <FiClock /> In progress <span className="schema-pill">{counts.in_progress}</span>
          </div>
          <div className="schema-body">
            {loading ? (
              <>
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </>
            ) : topInProgress.length === 0 ? (
              <div className="muted">No in-progress requests.</div>
            ) : (
              topInProgress.map((it) => (
                <div key={it.id} className="schema-row">
                  <span className="schema-pill">#{it.id}</span>
                  <div style={{ flex: 1 }}>
                    <div className="strong" style={{ fontSize: 13 }}>
                      {it.title}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {it.property?.title || "Property"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head">
            <FiCheckCircle /> Resolved / Closed
          </div>
          <div className="schema-body">
            {loading ? (
              <>
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </>
            ) : (
              <>
                <div className="schema-row">
                  <span className="schema-pill">resolved</span>
                  <div className="strong">{counts.resolved}</div>
                </div>
                <div className="schema-row">
                  <span className="schema-pill">closed</span>
                  <div className="strong">{counts.closed}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isBuyer ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">
            <FiPlus /> Create maintenance request
          </div>
          <div className="form">
            <div className="form-row">
              <div className="field">
                <label>Property ID</label>
                <input
                  className="input"
                  value={createPropertyId}
                  onChange={(e) => setCreatePropertyId(e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>

              <div className="field">
                <label>Priority</label>
                <select
                  className="input"
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value)}
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
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g. Heating not working"
              />
            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                className="input textarea"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Describe the issue..."
              />
            </div>

            <div className="actions">
              <button className="btn" onClick={createRequest} type="button" disabled={creating}>
                <FiPlus /> {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>

          <div className="note">
            This uses <b>POST /properties/:property/maintenance-requests</b>. The backend will reject
            the request unless you have an active or recently ended reservation for that property.
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Requests</div>

        <div className="form-row" style={{ alignItems: "end", marginBottom: 10 }}>
          <div className="field">
            <label>Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, property, city, description..."
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
              <div className="right">{canManage ? "Update" : "Action"}</div>
            </div>

            {filtered.map((it) => (
              <div key={it.id} className="row" style={{ gridTemplateColumns: tableCols }}>
                <div className="strong">#{it.id}</div>
                <div>
                  <div className="strong">{it.property?.title || "Property"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {it.property?.city || ""}
                  </div>
                </div>
                <div>
                  <div className="strong">{it.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {it.description
                      ? `${String(it.description).slice(0, 64)}${
                          String(it.description).length > 64 ? "…" : ""
                        }`
                      : "-"}
                  </div>
                </div>
                <div>
                  <span className="schema-pill">{it.priority}</span>
                </div>
                <div>{formatDateTime(it.reported_at || it.created_at)}</div>
                <div>
                  <span className={`pill pill--${it.status}`}>
                    {String(it.status).replace(/_/g, " ")}
                  </span>
                </div>

                <div className="right">
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => setActive(it)}
                    title="View"
                  >
                    <FiEye />
                  </button>

                  {canManage ? (
                    <select
                      className="input small"
                      value={it.status}
                      disabled={savingId === it.id}
                      onChange={(e) => updateStatus(it.id, e.target.value)}
                      title="Update status"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
            ))}
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
                  #{active.id} • {active.title}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {active.property?.title || "Property"}
                  {active.property?.city ? ` • ${active.property.city}` : ""}
                </div>
              </div>

              <button className="icon-btn" type="button" onClick={() => setActive(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="draft-grid">
                <div className="draft-card">
                  <div className="draft-title">Request</div>
                  <div className="schema-row">
                    <span className="schema-pill">priority</span>
                    <div className="strong">{active.priority}</div>
                  </div>
                  <div className="schema-row">
                    <span className="schema-pill">status</span>
                    <div className="strong">{String(active.status).replace(/_/g, " ")}</div>
                  </div>
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

              {canManage ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card-title">
                    <FiXCircle /> Update status
                  </div>

                  <div className="form-row" style={{ alignItems: "end" }}>
                    <div className="field">
                      <label>Status</label>
                      <select
                        className="input"
                        value={active.status}
                        disabled={savingId === active.id}
                        onChange={async (e) => {
                          const next = e.target.value;
                          await updateStatus(active.id, next);
                          setActive((prev) => (prev ? { ...prev, status: next } : prev));
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="note" style={{ marginTop: 0 }}>
                      Setting status to <b>resolved</b> or <b>closed</b> will lock in
                      <b> resolved_at</b> on the backend.
                    </div>
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
