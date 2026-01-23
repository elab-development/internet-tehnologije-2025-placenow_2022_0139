import { Link, useLocation } from "react-router-dom";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";

export default function Footer() {
  const location = useLocation();

  // Optional: hide footer on login/register (same idea as Nav)
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <footer className="footer-shell">
      <div className="footer">
        <div className="footer__left">
          <div className="footer__brand">
            <img className="footer__logo" src="/images/logo.png" alt="PlaceNow" />
          </div>

          <div className="footer__copyright">
            © {year} PlaceNow. All rights reserved.
          </div>
        </div>

        <div className="footer__right">

          <div className="footer__social">
            <a className="footer__icon" href="https://github.com" target="_blank" rel="noreferrer">
              <FiGithub />
            </a>
            <a className="footer__icon" href="https://linkedin.com" target="_blank" rel="noreferrer">
              <FiLinkedin />
            </a>
            <a className="footer__icon" href="mailto:support@placenow.com">
              <FiMail />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
