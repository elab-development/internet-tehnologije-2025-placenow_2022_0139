import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiLogOut,
  FiUser,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiTool,
  FiCalendar,
  FiHome,
  FiSearch,
  FiCreditCard,
} from "react-icons/fi";

const AUTH_EVENT = "auth-changed";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getSessionToken() {
  return sessionStorage.getItem("token");
}

function linksByRole(role) {
  if (role === "admin") {
    return [
      { to: "/admin/home", label: "Home", icon: <FiGrid /> },
      { to: "/admin/users", label: "Users", icon: <FiUsers /> },
      { to: "/admin/metrics", label: "Metrics", icon: <FiBarChart2 /> },
      { to: "/admin/reports", label: "Reports", icon: <FiFileText /> },
    ];
  }

  if (role === "seller") {
    return [
      { to: "/seller/home", label: "Home", icon: <FiGrid /> },
      { to: "/seller/properties", label: "Properties", icon: <FiHome /> },
      { to: "/seller/reservations", label: "Reservations", icon: <FiCalendar /> },
      { to: "/seller/maintenance", label: "Maintenance", icon: <FiTool /> },
      { to: "/seller/invoices", label: "Invoices", icon: <FiFileText /> },
    ];
  }

  return [
    { to: "/buyer/home", label: "Home", icon: <FiGrid /> },
    { to: "/buyer/properties", label: "Browse", icon: <FiSearch /> },
    { to: "/buyer/reservations", label: "Reservations", icon: <FiCalendar /> },
    { to: "/buyer/invoices", label: "Invoices", icon: <FiCreditCard /> },
    { to: "/buyer/maintenance", label: "Maintenance", icon: <FiTool /> },
  ];
}

export default function Nav() {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenOn = ["/login", "/register"];
  const shouldHide = hiddenOn.includes(location.pathname);

  const [token, setToken] = useState(() => getSessionToken());
  const [user, setUser] = useState(() => getSessionUser());

  // Sync Nav with sessionStorage (login/logout)
  useEffect(() => {
    const sync = () => {
      setToken(getSessionToken());
      setUser(getSessionUser());
    };

    // First sync on mount
    sync();

    // Other tabs/windows
    window.addEventListener("storage", sync);

    // Same tab: we dispatch this manually after login/logout
    window.addEventListener(AUTH_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, []);

  const role = user?.role || "buyer";
  const links = useMemo(() => linksByRole(role), [role]);

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // notify this tab immediately
    window.dispatchEvent(new Event(AUTH_EVENT));

    navigate("/login", { replace: true });
  }

  if (shouldHide || !token) return null;

  return (
    <div className="nav-shell">
      <nav className="nav">
        <div className="nav__left">
          <div className="nav__brand" onClick={() => navigate(`/${role}/home`)}>
            <img className="nav__logo" src="/images/logo.png" alt="PlaceNow" />
          </div>

          <div className="nav__links" aria-label="Main navigation">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => "nav__link" + (isActive ? " nav__link--active" : "")}
              >
                <span className="nav__linkIcon">{l.icon}</span>
                <span className="nav__linkText">{l.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="nav__right">
          <div className="nav__user">
            <div className="nav__userIcon">
              <FiUser />
            </div>
            <div className="nav__userText">
              <div className="nav__userName">{user?.name || "User"}</div>
              <div className="nav__userEmail">{user?.email || ""}</div>
              <div className="nav__brandRole">{role}</div>
            </div>
          </div>

          <button className="nav__logout" onClick={logout} type="button">
            <FiLogOut />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
