import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Badge from "../components/Badge";
import CityMap, { LOCATION_BY_ID } from "../components/CityMap";
import FormField from "../components/FormField";
import { useToast } from "../components/ToastContainer";
import { locationCatalog } from "../data/locationCatalog";
import { createTrip, findRides, getDriverTrips, getRideRequest, registerDriver } from "../services/api";

const DEFAULT_LOCATION = locationCatalog.find((location) => location.lat !== undefined && location.lng !== undefined);
const ALL_REQUEST_IDS_KEY = "ridesharing_all_request_ids";
const pad = (n) => String(n).padStart(2, "0");

const registerInitialState = {
  name: "",
  email: "",
  phone: "",
  seats: ""
};

function readIdList(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nowISO() {
  return formatDateTime(new Date());
}

function oneHourFromNowISO() {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return formatDateTime(date);
}

function formatDisplayDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function getTripInitialState() {
  return {
    driverId: window.localStorage.getItem("ridesharing_driver_id") || "",
    seats: "",
    startTime: nowISO(),
    endTime: oneHourFromNowISO(),
    startLocation: "",
    endLocation: ""
  };
}

function validateRegister(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email.";
  if (!/^[+\d\s-]{8,}$/.test(values.phone)) errors.phone = "Enter a valid phone number.";
  if (!values.seats || Number(values.seats) <= 0) errors.seats = "Seats must be greater than zero.";
  return errors;
}

function validateTrip(values) {
  const errors = {};
  if (!values.driverId) errors.driverId = "Driver ID is required.";
  if (!values.seats || Number(values.seats) <= 0) errors.seats = "Seats must be greater than zero.";
  if (!values.startTime) errors.startTime = "Start time is required.";
  if (!values.endTime) errors.endTime = "End time is required.";
  if (values.startTime && values.endTime && new Date(values.endTime) <= new Date(values.startTime)) {
    errors.endTime = "End time must be after start time.";
  }
  if (!values.startLocation) errors.startLocation = "Start area is required.";
  if (!values.endLocation) errors.endLocation = "Destination area is required.";
  return errors;
}

function DriverPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "trip" ? "trip" : "register";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [registerForm, setRegisterForm] = useState(registerInitialState);
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [createdDriverId, setCreatedDriverId] = useState("");
  const [registerErrorMessage, setRegisterErrorMessage] = useState("");

  const [tripForm, setTripForm] = useState(getTripInitialState);
  const [tripErrors, setTripErrors] = useState({});
  const [tripLoading, setTripLoading] = useState(false);
  const [createdTripId, setCreatedTripId] = useState("");
  const [tripErrorMessage, setTripErrorMessage] = useState("");
  const [mapKey, setMapKey] = useState(0);

  const [driverTrips, setDriverTrips] = useState([]);
  const [matchedRiders, setMatchedRiders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const toast = useToast();

  const trackedDriverId = useMemo(
    () => tripForm.driverId || createdDriverId || window.localStorage.getItem("ridesharing_driver_id") || "",
    [tripForm.driverId, createdDriverId]
  );

  useEffect(() => {
    const driverId = searchParams.get("driverId");
    const requestedTab = searchParams.get("tab");

    if (requestedTab === "trip") {
      setActiveTab("trip");
    } else if (requestedTab === "register") {
      setActiveTab("register");
    }

    if (driverId) {
      setTripForm((current) => ({ ...current, driverId }));
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadDriverTracking() {
      if (!trackedDriverId) {
        setDriverTrips([]);
        setMatchedRiders([]);
        setTrackingError("");
        return;
      }

      setTrackingLoading(true);
      setTrackingError("");

      try {
        const trips = await getDriverTrips(trackedDriverId);
        const requestIds = readIdList(ALL_REQUEST_IDS_KEY);
        const matchGroups = await Promise.all(
          requestIds.map(async (requestId) => {
            try {
              const [request, matches] = await Promise.all([getRideRequest(requestId), findRides(requestId)]);
              return matches
                .filter((match) => Number(match.driverId) === Number(trackedDriverId))
                .map((match) => ({
                  request,
                  match,
                  trip: trips.find((trip) => Number(trip.id) === Number(match.tripId)) || null
                }));
            } catch {
              return [];
            }
          })
        );

        if (!cancelled) {
          setDriverTrips(trips.sort((left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime()));
          setMatchedRiders(
            matchGroups
              .flat()
              .sort((left, right) => Number(right.match.score || 0) - Number(left.match.score || 0))
          );
        }
      } catch (error) {
        if (!cancelled) {
          setDriverTrips([]);
          setMatchedRiders([]);
          setTrackingError(error.message);
        }
      } finally {
        if (!cancelled) {
          setTrackingLoading(false);
        }
      }
    }

    loadDriverTracking();

    return () => {
      cancelled = true;
    };
  }, [trackedDriverId, createdTripId]);

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
    setRegisterErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleTripChange(event) {
    const { name, value } = event.target;
    setTripForm((current) => ({ ...current, [name]: value }));
    setTripErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegister(registerForm);

    if (Object.keys(nextErrors).length > 0) {
      setRegisterErrors(nextErrors);
      return;
    }

    setRegisterLoading(true);
    setRegisterErrorMessage("");

    try {
      const response = await registerDriver({
        ...registerForm,
        lat: DEFAULT_LOCATION?.lat,
        lng: DEFAULT_LOCATION?.lng
      });

      const nextDriverId = String(response.id);
      window.localStorage.setItem("ridesharing_driver_id", nextDriverId);
      setCreatedDriverId(nextDriverId);
      setRegisterForm(registerInitialState);
      setTripForm((current) => ({
        ...current,
        driverId: nextDriverId,
        seats: current.seats || String(response.seats || "")
      }));
      toast.success("Driver registered", `Driver ID #${response.id} is ready.`);
    } catch (error) {
      setRegisterErrorMessage(error.message);
      toast.error("Registration failed", error.message);
    } finally {
      setRegisterLoading(false);
    }
  }

  async function submitTrip(nextForm) {
    const nextErrors = validateTrip(nextForm);

    if (Object.keys(nextErrors).length > 0) {
      setTripErrors(nextErrors);
      return;
    }

    setTripLoading(true);
    setTripErrorMessage("");

    try {
      const response = await createTrip(nextForm);
      const nextDriverId = String(nextForm.driverId);
      window.localStorage.setItem("ridesharing_driver_id", nextDriverId);
      setCreatedTripId(String(response.id));
      setTripForm({
        ...getTripInitialState(),
        driverId: nextDriverId
      });
      setMapKey((current) => current + 1);
      toast.success("Trip created", `Trip #${response.id} is ready.`);
    } catch (error) {
      setTripErrorMessage(error.message);
      toast.error("Trip creation failed", error.message);
    } finally {
      setTripLoading(false);
    }
  }

  async function handleMapTripCreate(data) {
    const start = LOCATION_BY_ID[data.startId];
    const end = LOCATION_BY_ID[data.endId];

    if (!start || !end) {
      toast.error("Unknown map location", "The selected route could not be translated.");
      return;
    }

    const nextForm = {
      ...tripForm,
      startLocation: data.startName,
      endLocation: data.endName,
      startLat: start.x / 30,
      startLng: start.y / 30,
      endLat: end.x / 30,
      endLng: end.y / 30
    };

    setTripForm(nextForm);
    await submitTrip(nextForm);
  }

  async function refreshDriverTracking() {
    if (!trackedDriverId) return;

    setTrackingLoading(true);
    setTrackingError("");

    try {
      const trips = await getDriverTrips(trackedDriverId);
      const requestIds = readIdList(ALL_REQUEST_IDS_KEY);
      const matchGroups = await Promise.all(
        requestIds.map(async (requestId) => {
          try {
            const [request, matches] = await Promise.all([getRideRequest(requestId), findRides(requestId)]);
            return matches
              .filter((match) => Number(match.driverId) === Number(trackedDriverId))
              .map((match) => ({
                request,
                match,
                trip: trips.find((trip) => Number(trip.id) === Number(match.tripId)) || null
              }));
          } catch {
            return [];
          }
        })
      );

      setDriverTrips(trips.sort((left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime()));
      setMatchedRiders(
        matchGroups
          .flat()
          .sort((left, right) => Number(right.match.score || 0) - Number(left.match.score || 0))
      );
    } catch (error) {
      setDriverTrips([]);
      setMatchedRiders([]);
      setTrackingError(error.message);
    } finally {
      setTrackingLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Driver</h1>
        </div>
      </section>

      <section className="form-shell page-stack">
        <div
          className="inline-actions"
          role="tablist"
          aria-label="Driver tabs"
          style={{ marginBottom: "0.5rem" }}
        >
          <button
            className={activeTab === "register" ? "button" : "ghost-button"}
            type="button"
            role="tab"
            aria-selected={activeTab === "register"}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
          <button
            className={activeTab === "trip" ? "button" : "ghost-button"}
            type="button"
            role="tab"
            aria-selected={activeTab === "trip"}
            onClick={() => setActiveTab("trip")}
          >
            Create Trip
          </button>
        </div>

        {activeTab === "register" ? (
          <form className="page-stack" onSubmit={handleRegisterSubmit}>
            <div className="form-grid">
              <FormField
                label="Name"
                name="name"
                value={registerForm.name}
                onChange={handleRegisterChange}
                error={registerErrors.name}
                required
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                error={registerErrors.email}
                required
              />
              <FormField
                label="Phone"
                name="phone"
                value={registerForm.phone}
                onChange={handleRegisterChange}
                error={registerErrors.phone}
                required
              />
              <FormField
                label="Seats"
                name="seats"
                type="number"
                min="1"
                value={registerForm.seats}
                onChange={handleRegisterChange}
                error={registerErrors.seats}
                required
              />
            </div>

            {registerErrorMessage ? <div className="alert">{registerErrorMessage}</div> : null}
            {createdDriverId ? <div className="glass-card">Driver ID #{createdDriverId}</div> : null}

            <div className="form-actions">
              <button className="button" type="submit" disabled={registerLoading}>
                {registerLoading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        ) : (
          <div className="page-stack">
            <div
              className="form-grid"
              style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
            >
              <FormField
                label="Driver ID"
                name="driverId"
                type="number"
                value={tripForm.driverId}
                onChange={handleTripChange}
                error={tripErrors.driverId}
                required
              />
              <FormField
                label="Seats"
                name="seats"
                type="number"
                min="1"
                value={tripForm.seats}
                onChange={handleTripChange}
                error={tripErrors.seats}
                required
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <FormField
                  label="Start Time"
                  name="startTime"
                  type="datetime-local"
                  value={tripForm.startTime}
                  onChange={handleTripChange}
                  error={tripErrors.startTime}
                  required
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <FormField
                  label="End Time"
                  name="endTime"
                  type="datetime-local"
                  value={tripForm.endTime}
                  onChange={handleTripChange}
                  error={tripErrors.endTime}
                  required
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem"
              }}
            >
              <style>
                {`
                  .driver-page-map .city-map__controls {
                    display: none;
                  }
                `}
              </style>
              <div className="driver-page-map">
                <CityMap key={mapKey} initialMode="driver" onTripCreate={handleMapTripCreate} />
              </div>
            </div>

            {tripErrors.startLocation || tripErrors.endLocation ? (
              <div className="alert">{tripErrors.startLocation || tripErrors.endLocation}</div>
            ) : null}
            {tripErrorMessage ? <div className="alert">{tripErrorMessage}</div> : null}
            {createdTripId ? <div className="glass-card">Trip ID #{createdTripId}</div> : null}

            <div className="form-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setTripErrors({});
                  setTripErrorMessage("");
                  setTripForm(getTripInitialState());
                  setMapKey((current) => current + 1);
                }}
                disabled={tripLoading}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="page-stack">
        <div className="page-header">
          <div>
            <h2 className="section-title">Driver Tracking</h2>
          </div>
          <div className="inline-actions">
            <div className="glass-card">Tracking Driver ID #{trackedDriverId || "-"}</div>
            <button className="ghost-button" type="button" onClick={refreshDriverTracking} disabled={!trackedDriverId || trackingLoading}>
              {trackingLoading ? "Refreshing..." : "Refresh Riders"}
            </button>
          </div>
        </div>

        {!trackedDriverId ? (
          <div className="empty-state">
            <div>
              <h3>No driver selected</h3>
              <p className="section-copy">Register a driver or enter a driver ID in Create Trip to see trips and matched riders here.</p>
            </div>
          </div>
        ) : null}

        {trackedDriverId && trackingError ? (
          <div className="alert">
            <h3>Could not load driver tracking</h3>
            <p>{trackingError}</p>
          </div>
        ) : null}

        {trackedDriverId && !trackingLoading && !trackingError ? (
          <div className="glass-card section-block">
            <div className="page-header">
              <div>
                <h3>Your Trips</h3>
              </div>
            </div>

            {driverTrips.length === 0 ? (
              <div className="empty-state">
                <div>
                  <h3>No trips created yet</h3>
                  <p className="section-copy">Create a trip for this driver ID and it will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="table-shell">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Trip ID</th>
                        <th>Route</th>
                        <th>Time</th>
                        <th>Seats</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverTrips.map((trip) => (
                        <tr key={trip.id}>
                          <td>#{trip.id}</td>
                          <td>
                            {trip.startLoc} → {trip.endLoc}
                          </td>
                          <td>
                            {formatDisplayDateTime(trip.startTime)} - {new Date(trip.endTime).toLocaleTimeString()}
                          </td>
                          <td>{trip.seats}</td>
                          <td>
                            <Badge status={trip.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {trackedDriverId && !trackingLoading && !trackingError ? (
          <div className="glass-card section-block">
            <div className="page-header">
              <div>
                <h3>Matched Riders</h3>
              </div>
            </div>

            {matchedRiders.length === 0 ? (
              <div className="empty-state">
                <div>
                  <h3>No rider matches yet</h3>
                  <p className="section-copy">When any saved rider request matches this driver’s trips, the rider details will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="table-shell">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rider</th>
                        <th>Request</th>
                        <th>Trip</th>
                        <th>Rider Route</th>
                        <th>Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedRiders.map((item) => (
                        <tr key={`${item.match.matchId}-${item.request.id}`}>
                          <td>
                            {item.request.user?.name || "Rider"} #{item.request.user?.id}
                          </td>
                          <td>
                            #{item.request.id} • {formatDisplayDateTime(item.request.time)}
                          </td>
                          <td>
                            #{item.match.tripId}
                            {item.trip ? ` • ${item.trip.startLoc} → ${item.trip.endLoc}` : ""}
                          </td>
                          <td>
                            {item.request.startLoc} → {item.request.endLoc}
                          </td>
                          <td>{Number(item.match.score || 0).toFixed(2)}</td>
                          <td>
                            <Badge status={item.match.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default DriverPage;
