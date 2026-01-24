import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiPhone } from "react-icons/fi";
import api from "../api/axios";
import '../App.css'

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Backend ti trenutno prima: name, email, password.
      // Phone ne šaljemo ako backend nema polje.
      await api.post("/api/register", { name, email, password });

      // Posle registracije -> login i prefill email.
      navigate("/login", { replace: true, state: { email } });
    } catch (e2) {
      setError(e2?.response?.data?.message || "Registration failed.");
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

          <h1 className="auth-title">Register</h1>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
              <div className="label">Name:</div>
              <div className="input-wrap">
                <FiUser className="auth-icon auth-icon--register" />
                <input
                  className="input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="field">
              <div className="label">Email:</div>
              <div className="input-wrap">
                <FiMail className="auth-icon auth-icon--register" />
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
                <FiLock className="auth-icon auth-icon--register" />
                <input
                  className="input"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={255}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="field">
              <div className="label">Phone:</div>
              <div className="input-wrap">
                <FiPhone className="auth-icon auth-icon--register" />
                <input
                  className="input"
                  type="text"
                  placeholder="+381 64 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={40}
                />
              </div>
            </div>

            <button className="auth-btn auth-btn--register" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>

            {error ? <div className="error">{error}</div> : null}

            <div className="helper">
              Already have an account?{" "}
              <Link className="link" to="/login">
                Please, log in.
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
