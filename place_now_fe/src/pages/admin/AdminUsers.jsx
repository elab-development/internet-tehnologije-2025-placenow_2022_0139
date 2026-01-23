import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiUsers, FiSave } from "react-icons/fi";
import api from "../../api/axios";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminUsers() {
  const me = useMemo(() => getSessionUser(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [roleDraft, setRoleDraft] = useState({}); // { [userId]: "buyer" | "seller" | "admin" }
  const [savingId, setSavingId] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/admin/users");
      // AdminUserController::index -> { success:true, data: UserResource::collection(...) }
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setUsers(list);

      // init drafts from loaded users
      const init = {};
      for (const u of list) init[u.id] = u.role;
      setRoleDraft(init);
    } catch (e) {
      setUsers([]);
      setRoleDraft({});
      setError(e?.response?.data?.message || "Ne mogu da učitam korisnike.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRole(userId) {
    const nextRole = roleDraft[userId];
    if (!nextRole) return;

    setSavingId(userId);
    setError("");

    try {
      const res = await api.patch(`/api/admin/users/${userId}/role`, { role: nextRole });
      // updateRole -> data.user exists
      const updated = res?.data?.data?.user;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...(updated || {}), role: nextRole } : u)),
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Ne mogu da sačuvam ulogu.");
      // rollback draft to current user role if server rejected
      setRoleDraft((prev) => {
        const current = users.find((x) => x.id === userId)?.role;
        return { ...prev, [userId]: current ?? prev[userId] };
      });
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <FiUsers /> Admin Users
          </h1>
          <p className="page-subtitle">Upravljanje korisnicima i ulogama (buyer/seller/admin).</p>
        </div>

        <button className="btn" onClick={loadUsers} type="button" disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {me?.role !== "admin" ? (
        <div className="alert">Nemate dozvolu. Samo admin može da vidi ovu stranicu.</div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      <div className="card">
        <div className="card-title">Users</div>

        {loading ? (
          <div className="muted">Loading...</div>
        ) : users.length === 0 ? (
          <div className="muted">Nema korisnika.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10 }}>ID</th>
                  <th style={{ textAlign: "left", padding: 10 }}>Name</th>
                  <th style={{ textAlign: "left", padding: 10 }}>Email</th>
                  <th style={{ textAlign: "left", padding: 10 }}>Role</th>
                  <th style={{ textAlign: "left", padding: 10 }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const draft = roleDraft[u.id] ?? u.role;
                  const changed = draft !== u.role;

                  return (
                    <tr key={u.id}>
                      <td style={{ padding: 10 }}>{u.id}</td>
                      <td style={{ padding: 10 }}>{u.name}</td>
                      <td style={{ padding: 10 }}>{u.email}</td>

                      <td style={{ padding: 10 }}>
                        <select
                          className="input"
                          value={draft}
                          onChange={(e) => setRoleDraft((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          disabled={savingId === u.id}
                          style={{ minWidth: 160 }}
                        >
                          <option value="buyer">buyer</option>
                          <option value="seller">seller</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>

                      <td style={{ padding: 10 }}>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => saveRole(u.id)}
                          disabled={!changed || savingId === u.id}
                          title={!changed ? "Nema izmena." : "Sačuvaj."}
                        >
                          <FiSave /> {savingId === u.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
