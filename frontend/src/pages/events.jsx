
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";

function Events() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check login and retrieve events
  useEffect(() => {
    const ticket = localStorage.getItem("ticket");

    if (!ticket) {
      navigate("/login", { replace: true });
      return;
    }

    async function fetchEvents() {
      try {
        const response = await fetch("/api/events.php");
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.events)) {
          setError(data.message || "Could not retrieve events");
          return;
        }
        setEvents(data.events);
      } catch (err) {
        setError(err.message || "Could not retrieve events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [navigate]);

  const groupedEvents = events.reduce((groups, event) => {
    if (!groups[event.category]) {
      groups[event.category] = [];
    }

    groups[event.category].push(event);
    return groups;
  }, {});

  // Format event date and time for nicer presentation for user
  function formatDate(date) {
    return new Date(date.replace(" ", "T")).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  return (
    <div>
      <Header />

      <main style={{
        padding: "32px",
        maxWidth: "1200px",
        margin: "auto"
      }}>
        <h1>Welcome, {name}!</h1>
        <h2>Discover Events</h2>
        <p>Find events around campus, put yourself out there, and get ready to connect.</p>

        {loading && <p>Events are loading.</p>}
        {error && <p>{error}</p>}
        {!loading && !error && events.length === 0 && <p>There are no upcoming events.</p>}

        {!loading && !error && Object.entries(groupedEvents).map(
          ([category, categoryEvents]) => (
            <section key={category} style={{ marginTop: "36px" }}>
              <h2>{category}</h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "24px"
              }}>
                {categoryEvents.map((event) => (
                  <article
                    key={event.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      overflow: "hidden"
                    }}
                  >
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover"
                        }}
                      />
                    )}

                    <div style={{ padding: "16px" }}>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>When:</strong> {formatDate(event.start_time)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        )}
      </main>
    </div>
  );
}

export default Events;