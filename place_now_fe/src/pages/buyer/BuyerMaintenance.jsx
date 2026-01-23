import { FiTool, FiInfo } from "react-icons/fi";

export default function BuyerMaintenance() {
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">This page is started, maintenance creation flow will be added next.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <FiTool /> My Maintenance Requests (Draft UI)
        </div>

        <div className="schema-box">

          <div className="schema-row">
            <FiInfo />
            <span className="muted">
              Next: create request from a property reservation (title, description, priority).
            </span>
          </div>
        </div>

        <div className="muted" style={{ marginTop: 14 }}>
          Placeholder cards:
        </div>

        <div className="draft-grid">
          <div className="draft-card">
            <div className="draft-title">Request #—</div>
            <div className="muted">Property: …</div>
            <div className="muted">Priority: …</div>
            <div className="muted">Status: open</div>
          </div>

          <div className="draft-card">
            <div className="draft-title">Request #—</div>
            <div className="muted">Property: …</div>
            <div className="muted">Priority: …</div>
            <div className="muted">Status: in_progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}
