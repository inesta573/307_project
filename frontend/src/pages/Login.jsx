import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message;

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ email, pin }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("ticket", data.ticket);
        localStorage.setItem("name", data.name);
        localStorage.setItem("email", email);

        navigate("/events");
      } else {
        setError(data.message || "Invalid Email or PIN");
      }
    } catch (error) {
      setError("Unable to connect to the server");
    }
  }

  return (
    <div className="login-page">
      <header className="site-header">
        <div className="brand">CampusConnect</div>
        <nav className="site-nav">
          <span className="nav-link active">Discover</span>
          <span className="nav-link">Create Event</span>
        </nav>
      </header>

      <main className="login-main">
        <section className="login-card">
          <h1>
            Welcome to
            <br />
            CampusConnect
          </h1>

          <h2>Log In</h2>

          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit">Log in</button>

            {notice && <p className="login-notice">{notice}</p>}
            {error && <p className="login-error">{error}</p>}
          </form>

          <hr className="login-divider" />

          <p className="signup-prompt">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default Login;
