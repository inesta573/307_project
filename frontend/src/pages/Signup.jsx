import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../components/Header.css";
import "./Login.css";

const mcgillEmail = /^[^\s@]+@mail\.mcgill\.ca$/i;

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (pin !== confirmPin) {
      setError("Passwords do not match");
      return;
    }

    if (!mcgillEmail.test(email.trim())) {
      setError("Email must be a mail.mcgill.ca address");
      return;
    }

    try {
      const response = await fetch("/api/signup.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ name, email, pin }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        navigate("/login", {
          state: { message: "Account created. You can log in now." },
        });
      } else {
        setError(data.message || "Unable to create account");
      }
    } catch (error) {
      setError("Unable to connect to the server");
    }
  }

  return (
    <div className="login-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/signup" className="site-logo">CampusConnect</Link>
          <nav className="site-nav">
            <Link to="/login">Log in</Link>
          </nav>
        </div>
      </header>

      <main className="login-main">
        <section className="login-card">
          <h1 className="login-title">Create an account.</h1>
          <p className="login-intro">Use your McGill email to get started.</p>

          <form className="login-form" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="new-password"
              required
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label className="show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>

            <button type="submit">Sign up</button>

            {error && <p className="login-error">{error}</p>}
          </form>

          <hr className="login-divider" />

          <p className="signup-prompt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default Signup;
