import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CityMap, { LOCATION_BY_ID } from "../components/CityMap";
import FormField from "../components/FormField";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/ToastContainer";
import { createRideRequest } from "../services/api";

function getInitialState(userId) {
  return {
    userId: userId || window.localStorage.getItem("ridesharing_user_id") || "",
    startLocation: "",
    endLocation: "",
    time: "",
    seats: "1"
  };
}

function validate(values) {
  const errors = {};
  if (!values.userId) errors.userId = "User ID is required.";
  if (!values.startLocation) errors.startLocation = "Pickup area is required.";
  if (!values.endLocation) errors.endLocation = "Destination area is required.";
  if (!values.time) errors.time = "Pickup time is required.";
  if (!values.seats || Number(values.seats) <= 0) errors.seats = "Seats must be greater than zero.";
  return errors;
}

function RideRequestPage() {
  const [searchParams] = useSearchParams();
  const seededUserId = searchParams.get("userId") || "";
  const [form, setForm] = useState(() => getInitialState(seededUserId));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const toast = useToast();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function submitRide(nextForm) {
    const nextErrors = validate(nextForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await createRideRequest(nextForm);
      setCreatedRequest(response);
      window.localStorage.setItem("ridesharing_user_id", String(nextForm.userId));
      toast.success("Ride request created", `Request #${response.id} is ready for matchmaking.`);
      setForm(getInitialState(nextForm.userId));
      setMapKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error.message);
      toast.error("Request failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitRide(form);
  }

  async function handleMapRideRequest(data) {
    const pickup = LOCATION_BY_ID[data.pickupId];
    const drop = LOCATION_BY_ID[data.dropId];

    if (!pickup || !drop) {
      toast.error("Unknown map location", "The selected route could not be translated into request coordinates.");
      return;
    }

    const nextForm = {
      ...form,
      startLocation: data.pickupName,
      endLocation: data.dropName,
      startLat: pickup.x / 30,
      startLng: pickup.y / 30,
      endLat: drop.x / 30,
      endLng: drop.y / 30
    };

    setForm(nextForm);
    await submitRide(nextForm);
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Traveller Ride Request</h1>
          <p className="page-copy">
            Pick your pickup and destination areas, and let the system match you to the best route.
          </p>
        </div>
      </section>

      <section className="grid-2">
        <form className="form-shell" onSubmit={handleSubmit}>
          <div className="form-grid form-grid--wide">
            <FormField label="Traveller ID" name="userId" type="number" value={form.userId} onChange={handleChange} error={errors.userId} placeholder="101" required />
            <FormField label="Requested Time" name="time" type="datetime-local" value={form.time} onChange={handleChange} error={errors.time} required />
            <FormField label="Seats Needed" name="seats" type="number" min="1" value={form.seats} onChange={handleChange} error={errors.seats} required />
          </div>

          <div className="page-stack">
            <div>
              <span className="muted-label">Interactive route picker</span>
              <p className="form-help">
                Choose pickup and drop directly on the 900-node city graph. The map computes the shortest path and submits the request with normalized pseudo-coordinates.
              </p>
            </div>
            <CityMap key={mapKey} initialMode="rider" onRideRequest={handleMapRideRequest} />
            {errors.startLocation || errors.endLocation ? (
              <p className="form-help" style={{ color: "var(--danger)" }}>
                {errors.startLocation || errors.endLocation}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="alert">
              <h3>Could not create ride request</h3>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="form-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setForm(getInitialState(seededUserId));
                setErrors({});
                setMapKey((current) => current + 1);
              }}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="page-stack">
          {loading ? <LoadingSkeleton type="card" /> : null}

          {createdRequest ? (
            <div className="success-card">
              <h3>Ride request created</h3>
              <p className="section-copy">Request ID #{createdRequest.id} can now run through the matching engine.</p>
              <div className="success-actions">
                <Link className="button" to={`/matches?requestId=${createdRequest.id}`}>
                  Find Matches
                </Link>
                <Link className="text-button" to={`/request/${createdRequest.id}`}>
                  View Request Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">Q</div>
              <div>
                <h3>No request submitted yet</h3>
                <p className="section-copy">
                  Choose your rider info and timing, then use the map to trace an exact shortest-path request across the city grid.
                </p>
              </div>
            </div>
          )}

          <div className="glass-card">
            <span className="muted-label">Route intelligence</span>
            <h3>Shortest compatible path first</h3>
            <p className="section-copy">
              Your chosen markers are converted into graph nodes, routed with Dijkstra, and submitted as pseudo-coordinates so the backend can score overlap against published driver trips.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RideRequestPage;
