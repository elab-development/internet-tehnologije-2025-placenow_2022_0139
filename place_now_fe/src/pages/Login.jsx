import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import api from "../api/axios";
import '../App.css'

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefillEmail = location.state?.email || "";

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/login", { email, password });

      const user = res?.data?.data?.user;
      const token = res?.data?.data?.token;

      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", token);
      window.dispatchEvent(new Event("auth-changed"));

      const role = user?.role || "buyer";

      if (role === "admin") navigate("/admin/home", { replace: true });
      else if (role === "seller") navigate("/seller/home", { replace: true });
      else navigate("/buyer/home", { replace: true });
    } catch (e2) {
      setError(e2?.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src="/images/commercial.jpg" alt="Commercial" />
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/images/logo.png" alt="PlaceNow" />
          </div>

          <h1 className="auth-title">Login</h1>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
              <div className="label">Email:</div>
              <div className="input-wrap">
                <FiMail className="auth-icon auth-icon--login" />
                <input
                  className="input"
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={150}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <div className="label">Password:</div>
              <div className="input-wrap">
                <FiLock className="auth-icon auth-icon--login" />
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={255}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="auth-btn auth-btn--login" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {error ? <div className="error">{error}</div> : null}

            <div className="helper">
              Don&apos;t have an account yet?{" "}
              <Link className="link" to="/register">
                Please, register.
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
