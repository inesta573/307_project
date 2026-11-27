import { Link, NavLink } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/events" className="site-logo">CampusConnect</Link>
        <nav className="site-nav">
          <NavLink to="/events">Discover</NavLink>
          <NavLink to="/my-events">My Events</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/create" className="site-nav-create">Create Event</NavLink>
        </nav>
      </div>
    </header>
  );
}
