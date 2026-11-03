import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CityMap, { LOCATION_BY_ID } from "../components/CityMap";
import FormField from "../components/FormField";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/ToastContainer";
import { createTrip } from "../services/api";

function getInitialState(driverId) {
  return {
    driverId: driverId || window.localStorage.getItem("ridesharing_driver_id") || "",
    startLocation: "",
    endLocation: "",
    startTime: "",
    endTime: "",
    seats: ""
  };
}

function validate(values) {
  const errors = {};
  if (!values.driverId) errors.driverId = "Driver ID is required.";
  if (!values.startLocation) errors.startLocation = "Start area is required.";
  if (!values.endLocation) errors.endLocation = "Destination area is required.";
  if (!values.startTime) errors.startTime = "Start time is required.";
  if (!values.endTime) errors.endTime = "End time is required.";
  if (values.startTime && values.endTime && new Date(values.endTime) <= new Date(values.startTime)) {
    errors.endTime = "End time must be after start time.";
  }
  if (!values.seats || Number(values.seats) <= 0) errors.seats = "Seats must be greater than zero.";
  return errors;
}

function TripCreatePage() {
  const [searchParams] = useSearchParams();
  const seededDriverId = searchParams.get("driverId") || "";
  const [form, setForm] = useState(() => getInitialState(seededDriverId));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdTrip, setCreatedTrip] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const toast = useToast();

  const hint = useMemo(() => {
    if (seededDriverId) {
      return `Creating a trip for driver #${seededDriverId}.`;
    }
    return "Use your saved driver ID or enter it once, then choose route areas instead of coordinates.";
  }, [seededDriverId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function submitTrip(nextForm) {
    const nextErrors = validate(nextForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await createTrip(nextForm);
      setCreatedTrip(response);
      window.localStorage.setItem("ridesharing_driver_id", String(nextForm.driverId));
      toast.success("Trip created", `Trip #${response.id} is available for matchmaking.`);
      setForm(getInitialState(nextForm.driverId));
      setMapKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error.message);
      toast.error("Trip creation failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitTrip(form);
  }

  async function handleMapTripCreate(data) {
    const start = LOCATION_BY_ID[data.startId];
    const end = LOCATION_BY_ID[data.endId];

    if (!start || !end) {
      toast.error("Unknown map location", "The selected route could not be translated into trip coordinates.");
      return;
    }

    const nextForm = {
      ...form,
      startLocation: data.startName,
      endLocation: data.endName,
      startLat: start.x / 30,
      startLng: start.y / 30,
      endLat: end.x / 30,
      endLng: end.y / 30
    };

    setForm(nextForm);
    await submitTrip(nextForm);
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Driver Trip Creation</h1>
          <p className="page-copy">
            Define route areas, schedule, and seats so the backend can match travellers to your path.
          </p>
        </div>
      </section>

      <section className="grid-2">
        <form className="form-shell" onSubmit={handleSubmit}>
          <span className="muted-label">Driver context</span>
          <p className="form-help">{hint}</p>

          <div className="form-grid form-grid--wide">
            <FormField label="Driver ID" name="driverId" type="number" value={form.driverId} onChange={handleChange} error={errors.driverId} placeholder="201" required />
            <FormField label="Start Time" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} error={errors.startTime} required />
            <FormField label="End Time" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} error={errors.endTime} required />
            <FormField label="Seats" name="seats" type="number" min="1" value={form.seats} onChange={handleChange} error={errors.seats} placeholder="3" required />
          </div>

          <div className="page-stack">
            <div>
              <span className="muted-label">Driver route publisher</span>
              <p className="form-help">
                Define the day’s journey on the canvas instead of choosing loose coordinates. The dashed route is what riders will be matched against.
              </p>
            </div>
            <CityMap key={mapKey} initialMode="driver" onTripCreate={handleMapTripCreate} />
            {errors.startLocation || errors.endLocation ? (
              <p className="form-help" style={{ color: "var(--danger)" }}>
                {errors.startLocation || errors.endLocation}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="alert">
              <h3>Could not create trip</h3>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="form-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setForm(getInitialState(seededDriverId));
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

          {createdTrip ? (
            <div className="success-card">
              <h3>Trip created successfully</h3>
              <p className="section-copy">Trip ID #{createdTrip.id} is now live for traveller matching.</p>
              <div className="success-actions">
                <Link className="button" to={`/drivers/${createdTrip.driver?.id || form.driverId}`}>
                  View Trips
                </Link>
                <Link className="text-button" to="/trips">
                  Open Trip Table
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">T</div>
              <div>
                <h3>No trip created yet</h3>
                <p className="section-copy">
                  Set the schedule and seats, then publish a route straight from the graph so riders can be scored against the exact path you plan to drive.
                </p>
              </div>
            </div>
          )}

          <div className="glass-card">
            <span className="muted-label">Shortest path matching</span>
            <h3>Route-friendly input, existing engine underneath</h3>
            <p className="section-copy">
              The map computes a concrete driving path, then posts the same trip fields the backend already expects, including normalized start and end coordinates.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TripCreatePage;
