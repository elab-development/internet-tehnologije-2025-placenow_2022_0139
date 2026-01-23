import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiEdit3, FiTrash2, FiX, FiSave, FiRefreshCw } from "react-icons/fi";
import api from "../../api/axios";

function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function extractItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const lvl1 = payload.data ?? payload;
  if (Array.isArray(lvl1)) return lvl1;

  const lvl2 = lvl1.data ?? lvl1;
  if (Array.isArray(lvl2)) return lvl2;

  return [];
}

const initialForm = {
  title: "",
  description: "",
  address: "",
  city: "",
  price_per_night: "",
  status: "available",
  "360_image_url": "",
  "3d_sketchfab_model_url": "",
};

export default function SellerProperties() {
  const user = useMemo(() => getSessionUser(), []);
  const sellerId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [properties, setProperties] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      title: p.title || "",
      description: p.description || "",
      address: p.address || "",
      city: p.city || "",
      price_per_night: p.price_per_night ?? "",
      status: p.status || "available",
      "360_image_url": p["360_image_url"] || "",
      "3d_sketchfab_model_url": p["3d_sketchfab_model_url"] || "",
    });
    setError("");
  }

  async function fetchAllPagesByStatus(status) {
    const all = [];
    let page = 1;

    while (true) {
      const res = await api.get("/api/properties", {
        params: { status, page }, //  no sort=id
      });

      const batch = extractItems(res?.data);
      all.push(...batch);

      // paginate(6) => last page when batch < 6
      if (batch.length < 6) break;

      page += 1;
      if (page > 200) break;
    }

    return all;
  }

  async function loadProperties() {
    setLoading(true);
    setError("");
    setLoadedCount(0);

    try {
      const [available, unavailable, paused] = await Promise.all([
        fetchAllPagesByStatus("available"),
        fetchAllPagesByStatus("unavailable"),
        fetchAllPagesByStatus("paused"),
      ]);

      const merged = [...available, ...unavailable, ...paused];
      setLoadedCount(merged.length);

      //  Filter only if sellerId exists.
      // If sellerId is wrong or missing, show all (so you can see that API works).
      const mine = sellerId
        ? merged.filter((p) => Number(p.seller_id) === Number(sellerId))
        : merged;

      const map = new Map();
      mine.forEach((p) => map.set(p.id, p));
      setProperties(Array.from(map.values()).sort((a, b) => b.id - a.id));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.data?.errors ? JSON.stringify(e.response.data.errors) : "") ||
        e?.message ||
        "Failed to load properties.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        price_per_night: Number(form.price_per_night),
      };

      if (!editingId) {
        await api.post("/api/properties", payload);
      } else {
        await api.patch(`/api/properties/${editingId}`, payload);
      }

      startCreate();
      loadProperties();
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        (e2?.response?.data?.errors ? JSON.stringify(e2.response.data.errors) : "") ||
        "Validation error.";
      setError(msg);
    }
  }

  async function removeProperty(id) {
    if (!window.confirm("Delete this property?")) return;

    setError("");
    try {
      await api.delete(`/api/properties/${id}`);
      loadProperties();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete property.");
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Properties</h1>
        </div>

        <div className="page-actions">
          <button style={{ marginRight: 12 }} className="btn-secondary" onClick={loadProperties}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn-secondary" onClick={startCreate}>
            <FiPlus /> New
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">{editingId ? `Edit Property #${editingId}` : "Create Property"}</div>

          <form className="form" onSubmit={submit}>
            <div className="form-row">
              <div className="field">
                <label>Title</label>
                <input className="input" name="title" value={form.title} onChange={onChange} required />
              </div>

              <div className="field">
                <label>Status</label>
                <select className="input" name="status" value={form.status} onChange={onChange} required>
                  <option value="available">available</option>
                  <option value="unavailable">unavailable</option>
                  <option value="paused">paused</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>City</label>
                <input className="input" name="city" value={form.city} onChange={onChange} required />
              </div>

              <div className="field">
                <label>Price per night</label>
                <input
                  className="input"
                  name="price_per_night"
                  value={form.price_per_night}
                  onChange={onChange}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Address</label>
              <input className="input" name="address" value={form.address} onChange={onChange} required />
            </div>

            <div className="field">
              <label>Description</label>
              <textarea className="input textarea" name="description" value={form.description} onChange={onChange} />
            </div>

            <div className="field">
              <label>360 Image URL</label>
              <input className="input" name="360_image_url" value={form["360_image_url"]} onChange={onChange} />
            </div>

            <div className="field">
              <label>3D Sketchfab Model URL</label>
              <input
                className="input"
                name="3d_sketchfab_model_url"
                value={form["3d_sketchfab_model_url"]}
                onChange={onChange}
              />
            </div>

            {error ? <div className="alert">{error}</div> : null}

            <div className="actions">
              <button className="btn" type="submit">
                <FiSave /> {editingId ? "Save" : "Create"}
              </button>

              {editingId ? (
                <button className="btn-ghost" type="button" onClick={startCreate}>
                  <FiX /> Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title">My Properties</div>

          {loading ? (
            <div className="muted">Loading...</div>
          ) : properties.length === 0 ? (
            <div className="muted">No properties found.</div>
          ) : (
            <div className="table">
              <div className="row row--head">
                <div>Title</div>
                <div>City</div>
                <div>Price</div>
                <div>Status</div>
                <div className="right">Actions</div>
              </div>

              {properties.map((p) => (
                <div key={p.id} className="row">
                  <div className="strong">{p.title}</div>
                  <div>{p.city}</div>
                  <div>€ {p.price_per_night}</div>
                  <div>
                    <span className={`pill pill--${p.status}`}>{p.status}</span>
                  </div>
                  <div className="right">
                    <button className="icon-btn" onClick={() => startEdit(p)} title="Edit">
                      <FiEdit3 />
                    </button>
                    <button className="icon-btn danger" onClick={() => removeProperty(p.id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
