
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
        //save user to localStorage
        localStorage.setItem("ticket", data.ticket);
        localStorage.setItem("name", data.name);
        localStorage.setItem("email", email);

        //redirect to events page
        navigate("/events");
      } else {
        setError(data.message || "Invalid Email or PIN");
      }
    } catch (error) {
      setError("Unable to connect to the server");
    }
  }

  return (
    <div>
      <h1>CampusConnect Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
}

export default Login;
