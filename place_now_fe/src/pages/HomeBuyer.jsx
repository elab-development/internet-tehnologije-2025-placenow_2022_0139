import { useMemo } from "react";
import { FiSearch, FiCalendar, FiFileText, FiCompass } from "react-icons/fi";
import HomeCard from "../components/HomeCard";

export default function HomeBuyer() {
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = user?.role || "buyer";
  const name = user?.name || "Buyer";

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero__overlay">
          <div className="home-hero__content">
            <div className="home-hero__kicker">
              <FiCompass /> Buyer area
            </div>

            <div className="home-hero__title">Welcome, {name} ({role})!</div>

            <div className="home-hero__subtitle">
              Explore available properties, reserve your stay, track reservation status, and manage invoices.
              Everything you need is available through the shortcuts below.
            </div>

            <div className="home-stats">
              <div className="home-stat">
                <div className="home-stat__label">Step 1</div>
                <div className="home-stat__value">Browse</div>
              </div>
              <div className="home-stat">
                <div className="home-stat__label">Step 2</div>
                <div className="home-stat__value">Reserve</div>
              </div>
              <div className="home-stat">
                <div className="home-stat__label">Step 3</div>
                <div className="home-stat__value">Invoices</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-cards">
        <HomeCard
          icon={<FiSearch />}
          title="Browse Properties"
          badge="Explore"
          description="Filter and sort available properties by title, city, price, and status. Open details for full view and media."
          hint="Tip: Use filters to quickly find the best match for your budget and location."
          to="/buyer/properties"
        />

        <HomeCard
          icon={<FiCalendar />}
          title="My Reservations"
          badge="Bookings"
          description="View your reservations with dates, total price, status, and property info. Cancel when status allows."
          hint="Tip: If your reservation is pending, confirm details early to avoid conflicts."
          to="/buyer/reservations"
        />

        <HomeCard
          icon={<FiFileText />}
          title="My Invoices"
          badge="Payments"
          description="Track invoice amount, due date and payment status (unpaid/paid/overdue/cancelled) for your reservations."
          hint="Tip: Pay overdue invoices to keep your account in good standing."
          to="/buyer/invoices"
        />
      </div>
    </div>
  );
}
