import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function HomeCard({ icon, title, description, hint, badge, to = "#" }) {
  return (
    <Link to={to} className="home-card">
      <div className="home-card__icon">{icon}</div>

      <div className="home-card__body">
        <div className="home-card__top">
          <div className="home-card__title">{title}</div>
          {badge ? <div className="home-card__badge">{badge}</div> : null}
        </div>

        <div className="home-card__desc">{description}</div>
        {hint ? <div className="home-card__hint">{hint}</div> : null}
      </div>

      <div className="home-card__arrow">
        <FiArrowRight />
      </div>
    </Link>
  );
}
