import { useMemo } from "react";
import { FiUsers, FiBarChart2, FiFileText, FiShield } from "react-icons/fi";
import HomeCard from "../components/HomeCard";

export default function HomeAdmin() {
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = user?.role || "admin";
  const name = user?.name || "Admin";

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero__overlay">
          <div className="home-hero__content">
            <div className="home-hero__kicker">
              <FiShield /> Admin dashboard
            </div>

            <div className="home-hero__title">Welcome, {name} ({role})!</div>

            <div className="home-hero__subtitle">
              Manage the entire PlaceNow platform: user access, role control, performance tracking,
              and reporting. Use the shortcuts below to get where you need to be in one click.
            </div>

            <div className="home-stats">
              <div className="home-stat">
                <div className="home-stat__label">Quick action</div>
                <div className="home-stat__value">Manage users</div>
              </div>
              <div className="home-stat">
                <div className="home-stat__label">Insights</div>
                <div className="home-stat__value">Metrics & revenue</div>
              </div>
              <div className="home-stat">
                <div className="home-stat__label">Reports</div>
                <div className="home-stat__value">Custom period</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-cards">
        <HomeCard
          icon={<FiUsers />}
          title="User Management"
          badge="Admin"
          description="View all registered users, review their details, and update roles when needed (buyer ↔ seller)."
          hint="Tip: Keep roles updated to control access to properties, reservations and reports."
          to="/admin/users"
        />

        <HomeCard
          icon={<FiBarChart2 />}
          title="Platform Metrics"
          badge="Insights"
          description="Track reservations per seller, monthly revenue trends, active properties, and open maintenance requests."
          hint="Use metrics to spot spikes in demand and plan improvements."
          to="/admin/metrics"
        />

        <HomeCard
          icon={<FiFileText />}
          title="Reports"
          badge="Export"
          description="Generate reports for a selected period and review reservation and income data for performance monitoring."
          hint="Pick date range → generate report → analyze results."
          to="/admin/reports"
        />
      </div>
    </div>
  );
}
