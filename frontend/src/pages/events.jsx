
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import "./events.css";

function eventDate(date) {
  return new Date(date.replace(" ", "T"));
}

function formatDate(date) {
  return eventDate(date).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function isSameDay(date, day) {
  const eventDay = eventDate(date);
  return eventDay.getFullYear() === day.getFullYear()
    && eventDay.getMonth() === day.getMonth()
    && eventDay.getDate() === day.getDate();
}

function eventMeta(event) {
  const when = event.start_time ? formatDate(event.start_time) : "";
  return [event.location, when].filter(Boolean).join(" · ");
}

function EventCard({ event }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = event.image_url && !imageFailed;

  return (
    <article className="event-card">
      <div className="event-media">
        {showImage ? (
          <img
            src={event.image_url}
            alt=""
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="event-media-fallback" />
        )}
      </div>

      <div className="event-body">
        <h3>{event.title}</h3>
        {event.description && <p className="event-description">{event.description}</p>}
        <p className="event-meta">{eventMeta(event)}</p>
      </div>
    </article>
  );
}

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

  const todayEvents = events.filter((event) => isSameDay(event.start_time, new Date()));
  const highlightTitle = todayEvents.length > 0 ? "Today" : "Upcoming";
  const highlightEvents = todayEvents.length > 0 ? todayEvents : events.slice(0, 6);

  const groupedEvents = events.reduce((groups, event) => {
    if (!groups[event.category]) {
      groups[event.category] = [];
    }

    groups[event.category].push(event);
    return groups;
  }, {});

  return (
    <div className="events-page">
      <Header />

      <main className="events-main">
        <p className="events-welcome">Welcome, {name}</p>
        <h1>Discover Events</h1>
        <p className="events-intro">
          Find events around campus, put yourself out there, and get ready to connect.
        </p>

        {loading && <p className="events-status">Events are loading.</p>}
        {error && <p className="events-status events-status-error">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="events-status">There are no upcoming events.</p>
        )}

        {!loading && !error && highlightEvents.length > 0 && (
          <section className="event-category">
            <h2>{highlightTitle}</h2>

            <div className="event-carousel">
              {highlightEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && Object.entries(groupedEvents).map(
          ([category, categoryEvents]) => (
            <section key={category} className="event-category">
              <h2>{category}</h2>

              <div className="event-carousel">
                {categoryEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
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