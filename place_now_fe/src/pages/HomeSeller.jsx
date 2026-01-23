import { useMemo } from "react";
import { FiHome, FiCalendar, FiTool, FiTrendingUp } from "react-icons/fi";
import HomeCard from "../components/HomeCard";

export default function HomeSeller() {
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = user?.role || "seller";
  const name = user?.name || "Seller";

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero__overlay">
          <div className="home-hero__content">
            <div className="home-hero__kicker">
              <FiTrendingUp /> Seller workspace
            </div>

            <div className="home-hero__title">Welcome, {name} ({role})!</div>

            <div className="home-hero__subtitle">
              Manage your listings and everything around them: property details, reservation statuses,
              and maintenance requests. Keep availability accurate to maximize bookings.
            </div>

            <div className="home-stats">
              <div className="home-stat">
                <div className="home-stat__label">Focus</div>
                <div className="home-stat__value">Listings</div>
              </div>
              <div className="home-stat">
                <div className="home-stat__label">Daily work</div>
                <div className="home-stat__value">Reservations</div>
              </div>
              <div className="home-stat">
                <div className="home-stat__label">Support</div>
                <div className="home-stat__value">Maintenance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-cards">
        <HomeCard
          icon={<FiHome />}
          title="My Properties"
          badge="Seller"
          description="Create new properties, update price per night, address, city, status, and add 360° / 3D model links."
          hint="Tip: Keep status set to available for visibility in the buyer listing."
          to="/seller/properties"
        />

        <HomeCard
          icon={<FiCalendar />}
          title="Reservations"
          badge="Workflow"
          description="Review reservations for your properties and keep statuses up to date: pending, confirmed, cancelled, completed."
          hint="Tip: Confirm quickly to reduce cancellations and improve buyer trust."
          to="/seller/reservations"
        />

        <HomeCard
          icon={<FiTool />}
          title="Maintenance Requests"
          badge="Support"
          description="Track issues reported by buyers, update statuses (open → in_progress → resolved/closed) and respond faster."
          hint="Tip: Keeping maintenance clean increases ratings and repeat bookings."
          to="/seller/maintenance"
        />
      </div>
    </div>
  );
}
