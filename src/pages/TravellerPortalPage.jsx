import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";

function TravellerPortalPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(window.localStorage.getItem("ridesharing_user_id") || "");

  function handleContinue(event) {
    event.preventDefault();
    if (!userId) {
      return;
    }
    window.localStorage.setItem("ridesharing_user_id", userId);
    navigate(`/ride-request?userId=${userId}`);
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Traveller portal</span>
            <h1>Choose places you know. We calculate the route behind the scenes.</h1>
            <p>
              Travellers should not need latitude and longitude. Register once, then request a ride
              with area names and let the matching engine find the shortest compatible trip.
            </p>
          </div>
          <div className="visual-panel">
            <div className="muted-label">Returning traveller</div>
            <form className="page-stack" onSubmit={handleContinue}>
              <FormField
                label="Traveller ID"
                name="travellerId"
                type="number"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Enter your traveller ID"
              />
              <div className="success-actions">
                <button className="button" type="submit">
                  Continue to Request
                </button>
                <Link className="ghost-button" to="/rider-register">
                  Create Traveller Account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TravellerPortalPage;
