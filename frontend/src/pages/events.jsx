
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import "./events.css";

function eventDate(date) {
  return new Date(date.replace(" ", "T"));
}

function formatKickerDate(date) {
  return eventDate(date).toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function formatTime(date) {
  return eventDate(date).toLocaleTimeString([], {
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

function EventArrow() {
  return (
    <svg className="event-arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
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
        <p className="event-kicker">
          {event.start_time && <span>{formatKickerDate(event.start_time)}</span>}
          {event.category && <span>{event.category}</span>}
        </p>
        <div className="event-title-row">
          <h3>{event.title}</h3>
          <EventArrow />
        </div>
        {event.description && <p className="event-description">{event.description}</p>}
        <dl className="event-facts">
          {event.location && (
            <div>
              <dt>Location</dt>
              <dd>{event.location}</dd>
            </div>
          )}
          {event.start_time && (
            <div>
              <dt>Time</dt>
              <dd>{formatTime(event.start_time)}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

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

  const preferredFilters = ["Sports", "Clubs", "Study", "Music", "Arts", "Food"];
  const filterNames = [
    "All",
    ...preferredFilters.filter((name) => groupedEvents[name]),
    ...Object.keys(groupedEvents).filter((name) => !preferredFilters.includes(name))
  ];
  const visibleGroups = filter === "All"
    ? groupedEvents
    : Object.fromEntries(
        Object.entries(groupedEvents).filter(([category]) => category === filter)
      );

  return (
    <div className="events-page">
      <Header />

      <main className="events-main">
        <p className="events-label">Montréal / Campus life</p>
        <h1>What's happening on campus.</h1>
        <p className="events-intro">Your guide to life beyond the lecture hall.</p>

        {!loading && !error && events.length > 0 && (
          <div className="event-filters" role="tablist" aria-label="Event categories">
            {filterNames.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                className={filter === name ? "event-filter is-selected" : "event-filter"}
                aria-selected={filter === name}
                onClick={() => setFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="events-status">Events are loading.</p>}
        {error && <p className="events-status events-status-error">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="events-status">There are no upcoming events.</p>
        )}

        {!loading && !error && filter === "All" && highlightEvents.length > 0 && (
          <section className="event-category">
            <h2>{highlightTitle}</h2>

            <div className="event-carousel">
              {highlightEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && Object.entries(visibleGroups).map(
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