import { FiFileText, FiDollarSign, FiCalendar } from "react-icons/fi";

export default function SellerInvoices() {
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Invoices</h1>
        </div>
      </div>

      <div className="grid-2">
        <div className="schema-card">
          <div className="schema-head"><FiFileText /> Invoice list</div>
          <div className="schema-body">
            <div className="skeleton-row"><span className="dot" /><div className="skeleton-line" /></div>
            <div className="skeleton-row"><span className="dot" /><div className="skeleton-line" /></div>
            <div className="skeleton-row"><span className="dot" /><div className="skeleton-line short" /></div>
          </div>
        </div>

        <div className="schema-card">
          <div className="schema-head"><FiDollarSign /> Create invoice (preview)</div>
          <div className="schema-body">
            <div className="schema-field">
              <label>Amount</label>
              <div className="fake-input"><FiDollarSign /> <span>€ 0.00</span></div>
            </div>

            <div className="schema-field">
              <label>Due date</label>
              <div className="fake-input"><FiCalendar /> <span>YYYY-MM-DD</span></div>
            </div>

            <div className="fake-btn">Create invoice (coming soon)</div>
          </div>
        </div>
      </div>

    </div>
  );
}
