import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./profile.css";

const years = ["U0", "U1", "U2", "U3", "U4", "Masters", "PhD"];
const faculties = [
  "Arts",
  "Science",
  "Engineering",
  "Management",
  "Law",
  "Medicine and Health Sciences",
  "Education",
  "Agricultural and Environmental Sciences",
  "Music",
  "Dental Medicine",
];

const emptyProfile = {
  program: "",
  studyYear: "",
  faculty: "",
  pronouns: "",
  bio: "",
  interests: [],
  avatar: "",
};

function profileFrom(source) {
  return {
    ...emptyProfile,
    program: source?.program || "",
    studyYear: source?.studyYear || "",
    faculty: source?.faculty || "",
    pronouns: source?.pronouns || "",
    bio: source?.bio || "",
    interests: Array.isArray(source?.interests) ? source.interests : [],
    avatar: typeof source?.avatar === "string" ? source.avatar : "",
  };
}

function readStoredProfile() {
  const email = localStorage.getItem("email") || "";
  try {
    const stored = JSON.parse(localStorage.getItem("profile") || "null");
    if (!stored || stored.email !== email) {
      return null;
    }
    return profileFrom(stored);
  } catch {
    return null;
  }
}

function writeStoredProfile(profile) {
  localStorage.setItem("profile", JSON.stringify({
    ...profile,
    email: localStorage.getItem("email") || "",
  }));
}

function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("email") || "");
  const [saved, setSaved] = useState(() => readStoredProfile() || emptyProfile);
  const [draft, setDraft] = useState(() => readStoredProfile() || emptyProfile);
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [interestDraft, setInterestDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const photoInput = useRef(null);

  useEffect(() => {
    const ticket = localStorage.getItem("ticket");
    if (!ticket) {
      navigate("/login", { replace: true });
      return;
    }

    if (readStoredProfile()) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ ticket, action: "get" }),
        });
        const data = await response.json();
        if (cancelled) {
          return;
        }
        if (!response.ok || !data.success) {
          setError(data.message || "Could not load your profile. The database tunnel may be closed.");
          return;
        }
        const profile = profileFrom(data.profile);
        setName(data.profile.name || "");
        setEmail(data.profile.email || "");
        setSaved(profile);
        setDraft(profile);
        writeStoredProfile(profile);
      } catch {
        if (!cancelled) {
          setError("Could not load your profile. The database tunnel may be closed.");
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      URL.revokeObjectURL(objectUrl);
      updateField("avatar", canvas.toDataURL("image/jpeg", 0.85));
      setError("");
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Could not read that image");
    };
    image.src = objectUrl;
  }

  function addInterest() {
    const next = interestDraft.trim();
    if (!next || draft.interests.includes(next) || draft.interests.length >= 12) {
      setInterestDraft("");
      return;
    }
    updateField("interests", [...draft.interests, next]);
    setInterestDraft("");
  }

  function startEditing() {
    setDraft(saved);
    setInterestDraft("");
    setError("");
    setNotice("");
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(saved);
    setInterestDraft("");
    setError("");
    setEditing(false);
  }

  async function saveProfile(event) {
    event.preventDefault();
    const ticket = localStorage.getItem("ticket");
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ticket,
          action: "save",
          program: draft.program,
          studyYear: draft.studyYear,
          faculty: draft.faculty,
          pronouns: draft.pronouns,
          bio: draft.bio,
          interests: JSON.stringify(draft.interests),
          avatar: draft.avatar,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Could not save your profile");
        return;
      }
      const profile = profileFrom(data.profile);
      setSaved(profile);
      setDraft(profile);
      writeStoredProfile(profile);
      setEditing(false);
      setNotice("Profile saved.");
    } catch {
      setError("Could not save your profile. The database tunnel may be closed.");
    } finally {
      setSaving(false);
    }
  }

  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  const subtitle = draft.program
    ? [draft.studyYear, draft.program].filter(Boolean).join(" · ")
    : "Add your program";

  return (
    <div className="profile-page">
      <Header />
      <main className="profile-main">
        <h1>My Profile</h1>
        <section className="profile-card">
          <div className="profile-head">
            <div className="profile-photo">
              {editing ? (
                <button
                  type="button"
                  className="profile-avatar"
                  onClick={() => photoInput.current?.click()}
                  aria-label="Add profile picture"
                >
                  {draft.avatar ? <img src={draft.avatar} alt="" /> : initial}
                </button>
              ) : (
                <div className="profile-avatar" aria-hidden="true">
                  {draft.avatar ? <img src={draft.avatar} alt="" /> : initial}
                </div>
              )}
              {editing && (
                <div className="profile-photo-actions">
                  <button type="button" className="profile-photo-action" onClick={() => photoInput.current?.click()}>
                    {draft.avatar ? "Change" : "Add photo"}
                  </button>
                  {draft.avatar && (
                    <button type="button" className="profile-photo-action" onClick={() => updateField("avatar", "")}>
                      Remove
                    </button>
                  )}
                </div>
              )}
              <input
                id="profile-photo"
                ref={photoInput}
                className="profile-photo-input"
                type="file"
                accept="image/*"
                onChange={choosePhoto}
              />
            </div>
            <div className="profile-identity">
              <h2>{name || "Student"}{previewing && draft.pronouns ? ` · ${draft.pronouns}` : ""}</h2>
              <p>{previewing ? [draft.studyYear, draft.program, draft.faculty].filter(Boolean).join(" · ") || "McGill student" : subtitle}</p>
              <p>0 hosted · 0 attended</p>
            </div>
            <div className="profile-actions">
              {previewing ? (
                <button type="button" className="profile-preview" onClick={() => setPreviewing(false)}>
                  Close preview
                </button>
              ) : editing ? (
                <>
                  <button type="button" className="profile-cancel" onClick={cancelEditing}>
                    Cancel
                  </button>
                  <button type="button" className="profile-preview" onClick={() => setPreviewing(true)}>
                    Preview
                  </button>
                  <button type="submit" form="profile-form" className="profile-edit" disabled={saving}>
                    {saving ? "Saving" : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="profile-preview" onClick={() => setPreviewing(true)}>
                    Preview
                  </button>
                  <button type="button" className="profile-edit" onClick={startEditing}>
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {previewing ? (
            <div className="profile-read">
              <p>{draft.bio || "No bio yet."}</p>
              <div className="profile-chips">
                {(draft.interests.length ? draft.interests : ["No interests yet."]).map((interest) => (
                  <span className="profile-chip" key={interest}>{interest}</span>
                ))}
              </div>
              <p>{email}</p>
            </div>
          ) : (
          <form id="profile-form" className="profile-form" onSubmit={saveProfile}>
            <div className="profile-field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" value={email} disabled />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-program">Program</label>
              <input
                id="profile-program"
                value={draft.program}
                onChange={(event) => updateField("program", event.target.value)}
                placeholder="e.g. Computer Science"
                maxLength={80}
                disabled={!editing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-year">Year</label>
              <select
                id="profile-year"
                value={draft.studyYear}
                onChange={(event) => updateField("studyYear", event.target.value)}
                disabled={!editing}
              >
                <option value="">Select year</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-faculty">Faculty</label>
              <select
                id="profile-faculty"
                value={draft.faculty}
                onChange={(event) => updateField("faculty", event.target.value)}
                disabled={!editing}
              >
                <option value="">Select faculty</option>
                {faculties.map((faculty) => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-pronouns">Pronouns</label>
              <input
                id="profile-pronouns"
                value={draft.pronouns}
                onChange={(event) => updateField("pronouns", event.target.value)}
                placeholder="e.g. she/her"
                maxLength={40}
                disabled={!editing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-bio">Bio</label>
              <input
                id="profile-bio"
                value={draft.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                placeholder="Tell other students about yourself"
                maxLength={500}
                disabled={!editing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-interest">Interests</label>
              {editing && draft.interests.length > 0 && (
                <div className="profile-chips">
                  {draft.interests.map((interest) => (
                    <span className="profile-chip" key={interest}>
                      {interest}
                      <button
                        type="button"
                        aria-label={`Remove ${interest}`}
                        onClick={() => updateField(
                          "interests",
                          draft.interests.filter((item) => item !== interest),
                        )}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                id="profile-interest"
                value={editing ? interestDraft : draft.interests.join(", ")}
                onChange={(event) => setInterestDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addInterest();
                  }
                }}
                placeholder={editing ? "Add an interest" : "No interests yet."}
                maxLength={40}
                disabled={!editing}
              />
            </div>

            {error && <p className="profile-message error">{error}</p>}
            {notice && <p className="profile-message saved">{notice}</p>}
          </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
