import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";

function DriverPortalPage() {
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState(window.localStorage.getItem("ridesharing_driver_id") || "");

  function handleContinue(event) {
    event.preventDefault();
    if (!driverId) {
      return;
    }
    window.localStorage.setItem("ridesharing_driver_id", driverId);
    navigate(`/trip-create?driverId=${driverId}`);
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Driver portal</span>
            <h1>Offer your route once and let nearby travellers align to it automatically.</h1>
            <p>
              Drivers choose start and destination areas, set timing and seats, and the platform
              finds travellers whose path best fits the route with minimum detour.
            </p>
          </div>
          <div className="visual-panel">
            <div className="muted-label">Returning driver</div>
            <form className="page-stack" onSubmit={handleContinue}>
              <FormField
                label="Driver ID"
                name="driverId"
                type="number"
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
                placeholder="Enter your driver ID"
              />
              <div className="success-actions">
                <button className="button" type="submit">
                  Continue to Trip Setup
                </button>
                <Link className="ghost-button" to="/driver-register">
                  Create Driver Account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DriverPortalPage;
