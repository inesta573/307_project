import { Link, NavLink } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/events" className="site-logo">campusConnect</Link>
      <nav className="site-nav">
        <NavLink to="/events">Discover</NavLink>
        <NavLink to="/create">Create event</NavLink>
        <NavLink to="/my-events">My Events</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>
    </header>
  );
}
