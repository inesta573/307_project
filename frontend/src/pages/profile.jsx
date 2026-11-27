
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function Profile() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("ticket");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    navigate("/login", { replace: true });
  }

  return (
    <div>
      <Header />

      <main style={{ padding: "32px" }}>
        <h1>Profile</h1>

        <button onClick={handleLogout}>
          Logout
        </button>
      </main>
    </div>
  );
}
