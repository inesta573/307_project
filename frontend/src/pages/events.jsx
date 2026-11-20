import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../Header";

function Events() {
  const navigate = useNavigate();
  const [name] = useState(() => localStorage.getItem("name"));

  useEffect(() => {
    //redirect if user is not logged in
    const ticket = localStorage.getItem("ticket");

    if (!ticket) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  function handleLogout() {
    //clear saved user information
    localStorage.removeItem("ticket");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    navigate("/login", { replace: true });
  }

  return (
    <div>
      <Header />

      <main style={{ padding: 32 }}>
        <h1>Welcome, {name}!</h1>

        <h2>Upcoming Events</h2>
        <p>Discover events happening around campus.</p>

        <button onClick={handleLogout}>
          Logout
        </button>
      </main>
    </div>
  );
}

export default Events;
