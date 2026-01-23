import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX, FiCalendar, FiHome, FiMapPin, FiUsers, FiCheckCircle } from "react-icons/fi";
import api from "../../api/axios";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** make relative /storage/... or //... URLs work in iframe + preview */
function toAbsoluteUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  const base = api?.defaults?.baseURL || "";
  const origin = base.replace(/\/api\/?$/, ""); // if baseURL ends with /api, remove it

  if (!origin) return raw;
  if (raw.startsWith("/")) return `${origin}${raw}`;
  return `${origin}/${raw}`;
}

/**
 * ✅ 360 LOGIC FROM OLD VERSION (only change requested):
 * Use pannellum CDN URL (the standalone one can 404 sometimes).
 * Pannellum expects the panorama URL encoded.
 */
function getPannellumEmbedUrl(panoramaUrl) {
  if (!panoramaUrl) return "";
  const abs = toAbsoluteUrl(panoramaUrl); // keep absolute fix from new version
  const u = encodeURIComponent(abs);
  return `https://cdn.pannellum.org/2.5/pannellum.htm#panorama=${u}&autoLoad=true`;
}

function getSketchfabEmbedUrl(input) {
  if (!input) return "";

  const str = String(input).trim();

  // If embed HTML was stored, extract src
  const srcMatch = str.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch?.[1]) return srcMatch[1];

  // Remove query params
  const noQuery = str.split("?")[0];

  // Already embed
  if (noQuery.includes("/embed") && noQuery.includes("sketchfab.com")) return noQuery;

  // https://sketchfab.com/models/<id>
  let m = noQuery.match(/sketchfab\.com\/models\/([a-zA-Z0-9]+)/i);
  if (m?.[1]) return `https://sketchfab.com/models/${m[1]}/embed`;

  // https://sketchfab.com/3d-models/<slug>-<id>
  m = noQuery.match(/sketchfab\.com\/3d-models\/.+-([a-zA-Z0-9]+)$/i);
  if (m?.[1]) return `https://sketchfab.com/models/${m[1]}/embed`;

  return "";
}

/**
 * Robust extractor for Laravel pagination responses.
 */
function extractListPayload(resData) {
  if (typeof resData === "string") {
    return {
      items: [],
      meta: null,
      links: null,
      error: "API returned HTML/text instead of JSON. Check axios baseURL / proxy and CORS.",
    };
  }

  const root = resData || {};
  const success = typeof root.success === "boolean" ? root.success : true;

  const level1 = root.data;
  const level2 = root?.data?.data;

  const paginatorCandidates = [level1, level2, root].filter(Boolean);

  for (const cand of paginatorCandidates) {
    if (cand && Array.isArray(cand.data)) {
      return {
        items: cand.data,
        meta: cand.meta || null,
        links: cand.links || null,
        error: success ? "" : root.message || "Request failed.",
      };
    }
  }

  if (Array.isArray(level1)) return { items: level1, meta: null, links: null, error: success ? "" : root.message || "Request failed." };
  if (Array.isArray(root.data)) return { items: root.data, meta: null, links: null, error: success ? "" : root.message || "Request failed." };
  if (Array.isArray(root)) return { items: root, meta: null, links: null, error: "" };

  return {
    items: [],
    meta: null,
    links: null,
    error: "Unexpected API response shape. The request succeeded but payload is not a Laravel paginator.",
  };
}

export default function BuyerBrowse() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // list state
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // filters
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  // details modal
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);

  // reservation form
  const [rStart, setRStart] = useState("");
  const [rEnd, setREnd] = useState("");
  const [rGuests, setRGuests] = useState(1);

  const token = useMemo(() => sessionStorage.getItem("token"), []);

  async function loadList(nextPage = 1) {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/properties", {
        params: {
          page: nextPage,
          q: q || undefined,
          city: city || undefined,
        },
      });

      const { items: list, meta, links, error: extractErr } = extractListPayload(res?.data);

      if (extractErr) {
        setItems([]);
        setPage(1);
        setTotalPages(1);
        setHasNext(false);
        setError(extractErr);
        return;
      }

      setItems(list);

      const current = Number(meta?.current_page || nextPage || 1);
      const last =
        Number(meta?.last_page) ||
        (meta?.total && meta?.per_page ? Math.max(1, Math.ceil(Number(meta.total) / Number(meta.per_page))) : 1);

      setPage(current);
      setTotalPages(last);

      const hasNextFromLinks = Boolean(links?.next);
      setHasNext(hasNextFromLinks || current < last);
    } catch (e) {
      setItems([]);
      setPage(1);
      setTotalPages(1);
      setHasNext(false);

      setError(e?.response?.data?.message || e?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(id) {
    setDetailsLoading(true);
    setError("");
    setDetails(null);

    try {
      const res = await api.get(`/api/properties/${id}`);
      setDetails(res?.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load property details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  function openDetails(p) {
    setSelectedId(p.id);
    setOpen(true);

    setRStart("");
    setREnd("");
    setRGuests(1);

    loadDetails(p.id);
  }

  function closeDetails() {
    setOpen(false);
    setSelectedId(null);
    setDetails(null);
  }

  async function reserve() {
    if (!token) {
      setError("You must be logged in as buyer to reserve.");
      return;
    }
    if (!selectedId) return;

    setError("");
    try {
      await api.post(`/api/properties/${selectedId}/reservations`, {
        start_date: rStart,
        end_date: rEnd,
        guests: Number(rGuests),
      });

      alert("Reservation created successfully.");
      closeDetails();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.data?.errors ? JSON.stringify(e.response.data.errors) : "") ||
        "Failed to create reservation.";
      setError(msg);
    }
  }

  useEffect(() => {
    loadList(1);
    // eslint-disable-next-line
  }, []);

  function onSearch(e) {
    e.preventDefault();
    loadList(1);
  }

  function prev() {
    const nextPage = Math.max(1, page - 1);
    loadList(nextPage);
  }

  function next() {
    const nextPage = page + 1;
    loadList(nextPage);
  }

  const sketchfabEmbed = details?.["3d_sketchfab_model_url"]
    ? getSketchfabEmbedUrl(details["3d_sketchfab_model_url"])
    : "";

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Browse</h1>
          <p className="page-subtitle">Explore available properties and create reservations.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Search</div>

        <form className="filter-row" onSubmit={onSearch}>
          <div className="filter-item">
            <FiSearch className="filter-icon" />
            <input className="input" placeholder="Search by title..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="filter-item">
            <FiMapPin className="filter-icon" />
            <input className="input" placeholder="City..." value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <button className="btn" type="submit">
            <FiSearch /> Search
          </button>
        </form>

        {error ? <div className="alert">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="muted">No properties found.</div>
        ) : (
          <>
            <div className="prop-grid">
              {items.map((p) => (
                <button key={p.id} className="prop-card" onClick={() => openDetails(p)} type="button">
                  <div className="prop-card__top">
                    <div className="prop-card__title">
                      <FiHome /> {p.title}
                    </div>
                    <span className={`pill pill--${p.status}`}>{p.status}</span>
                  </div>

                  <div className="prop-card__meta">
                    <div className="muted">
                      <FiMapPin /> {p.city}
                    </div>
                    <div className="strong">€ {p.price_per_night} / night</div>
                  </div>

                  <div className="prop-card__hint">
                    <FiCheckCircle /> Open details and reserve.
                  </div>
                </button>
              ))}
            </div>

            <div className="pager">
              <button className="btn-ghost" onClick={prev} disabled={page === 1}>
                Prev
              </button>

              <div className="muted">{totalPages > 1 ? `Page ${page} / ${totalPages}` : `Page ${page}`}</div>

              <button className="btn-ghost" onClick={next} disabled={!hasNext}>
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {open ? (
        <div className="modal-backdrop" onMouseDown={closeDetails}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Property Details</div>
              <button className="icon-btn" onClick={closeDetails} type="button">
                <FiX />
              </button>
            </div>

            {detailsLoading ? (
              <div className="muted">Loading details...</div>
            ) : details ? (
              <div className="modal-body">
                <div className="details-top">
                  <div>
                    <div className="details-title">{details.title}</div>
                    <div className="details-sub">
                      <FiMapPin /> {details.address}, {details.city}
                    </div>
                    <div className="details-sub">
                      <b>€ {details.price_per_night}</b> / night
                    </div>
                  </div>

                  <span className={`pill pill--${details.status}`}>{details.status}</span>
                </div>

                {details.description ? <div className="details-desc">{details.description}</div> : null}

                <div className="details-media">
                  <div className="media-card">
                    <div className="media-title">360° View</div>

                    {details["360_image_url"] ? (
                      <iframe
                        className="media-iframe"
                        title="360 Viewer"
                        src={getPannellumEmbedUrl(details["360_image_url"])}
                        allow="fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <div className="muted">No 360 image provided.</div>
                    )}

                    <div className="muted" style={{ marginTop: 8 }}>
                      Tip: drag with mouse to rotate.
                    </div>
                  </div>

                  <div className="media-card">
                    <div className="media-title">3D Model (Sketchfab)</div>

                    {sketchfabEmbed ? (
                      <div className="sketchfab-embed-wrapper">
                        <iframe
                          title={details.title || "Sketchfab Model"}
                          frameBorder="0"
                          allowFullScreen
                          mozAllowFullScreen={true}
                          webkitAllowFullScreen={true}
                          allow="autoplay; fullscreen; xr-spatial-tracking"
                          src={sketchfabEmbed}
                          style={{ width: "100%", height: "150%" }}
                        />
                        <p style={{ fontSize: 13, fontWeight: 400, margin: 5, color: "#4A4A4A" }}>
                          <a
                            href={String(details["3d_sketchfab_model_url"]).trim()}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            style={{ fontWeight: 700, color: "#1CAAD9" }}
                          >
                            Open on Sketchfab
                          </a>
                        </p>
                      </div>
                    ) : (
                      <div className="muted">No valid Sketchfab link.</div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card-title">
                    <FiCalendar /> Create Reservation
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Start date</label>
                      <input className="input" type="date" value={rStart} onChange={(e) => setRStart(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>End date</label>
                      <input className="input" type="date" value={rEnd} onChange={(e) => setREnd(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Guests</label>
                      <div className="inline-input">
                        <FiUsers className="inline-icon" />
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="20"
                          value={rGuests}
                          onChange={(e) => setRGuests(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="actions" style={{ marginTop: 12 }}>
                    <button className="btn" type="button" onClick={reserve}>
                      Reserve
                    </button>
                    <button className="btn-ghost" type="button" onClick={closeDetails}>
                      Close
                    </button>
                  </div>

                  <div className="muted" style={{ marginTop: 6 }}>
                    Dates preview: {formatDate(rStart)} → {formatDate(rEnd)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="muted">No details found.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
