import { FiAlertCircle, FiClock, FiCheckCircle } from "react-icons/fi";

export default function SellerMaintenance() {
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Maintenance</h1>

        </div>
      </div>

      <div className="grid-3">
        <div className="schema-card">
          <div className="schema-head"><FiAlertCircle /> Open</div>
          <div className="schema-body">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head"><FiClock /> In progress</div>
          <div className="schema-body">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head"><FiCheckCircle /> Resolved</div>
          <div className="schema-body">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
