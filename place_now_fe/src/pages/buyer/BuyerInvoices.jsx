import { FiCreditCard, FiInfo } from "react-icons/fi";

export default function BuyerInvoices() {
  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">This page is started, payment flow will be added next.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <FiCreditCard /> My Invoices (Draft UI)
        </div>

        <div className="schema-box">
          <div className="schema-row">
            <FiInfo />
            <span className="muted">
              Next: list invoices + a “Pay” button (only for unpaid/overdue).
            </span>
          </div>
        </div>

        <div className="muted" style={{ marginTop: 14 }}>
          Table placeholder:
        </div>

        <div className="table" style={{ marginTop: 10 }}>
          <div className="row row--head" style={{ gridTemplateColumns: "0.8fr 1.6fr 1fr 1fr 1fr" }}>
            <div>ID</div>
            <div>Reservation</div>
            <div>Amount</div>
            <div>Status</div>
            <div className="right">Action</div>
          </div>

          <div className="row" style={{ gridTemplateColumns: "0.8fr 1.6fr 1fr 1fr 1fr" }}>
            <div className="muted">#—</div>
            <div className="muted">Property title…</div>
            <div className="muted">€ —</div>
            <div className="muted">unpaid</div>
            <div className="right muted">Pay (soon)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
