import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Badge from "../components/Badge";
import CityMap, { LOCATION_BY_ID } from "../components/CityMap";
import FormField from "../components/FormField";
import { useToast } from "../components/ToastContainer";
import { locationCatalog } from "../data/locationCatalog";
import { bookRide, createRideRequest, findRides, getDriverTrips, getRideRequest, registerUser } from "../services/api";

const DEFAULT_LOCATION = locationCatalog.find((location) => location.lat !== undefined && location.lng !== undefined);
const ALL_REQUEST_IDS_KEY = "ridesharing_all_request_ids";
const pad = (n) => String(n).padStart(2, "0");

const registerInitialState = {
  name: "",
  email: "",
  phone: ""
};

function getRequestStorageKey(userId) {
  return `ridesharing_request_ids_user_${userId}`;
}

function readIdList(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeIdList(key, ids) {
  const uniqueIds = [...new Set(ids.map(String))];
  window.localStorage.setItem(key, JSON.stringify(uniqueIds));
}

function appendRequestId(userId, requestId) {
  const nextRequestId = String(requestId);
  writeIdList(getRequestStorageKey(userId), [nextRequestId, ...readIdList(getRequestStorageKey(userId))]);
  writeIdList(ALL_REQUEST_IDS_KEY, [nextRequestId, ...readIdList(ALL_REQUEST_IDS_KEY)]);
}

function getStoredRequestIds(userId) {
  if (!userId) return [];
  return readIdList(getRequestStorageKey(userId));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function getNowValue() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getRequestInitialState() {
  return {
    userId: window.localStorage.getItem("ridesharing_user_id") || "",
    seats: "1",
    time: getNowValue(),
    startLocation: "",
    endLocation: ""
  };
}

function validateRegister(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email.";
  if (!/^[+\d\s-]{8,}$/.test(values.phone)) errors.phone = "Enter a valid phone number.";
  return errors;
}

function validateRequest(values) {
  const errors = {};
  if (!values.userId) errors.userId = "User ID is required.";
  if (!values.seats || Number(values.seats) <= 0) errors.seats = "Seats must be greater than zero.";
  if (!values.time) errors.time = "Requested time is required.";
  if (!values.startLocation) errors.startLocation = "Pickup area is required.";
  if (!values.endLocation) errors.endLocation = "Destination area is required.";
  return errors;
}

function RiderPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "request" ? "request" : "register";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [registerForm, setRegisterForm] = useState(registerInitialState);
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");
  const [registerErrorMessage, setRegisterErrorMessage] = useState("");

  const [requestForm, setRequestForm] = useState(getRequestInitialState);
  const [requestErrors, setRequestErrors] = useState({});
  const [requestLoading, setRequestLoading] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState("");
  const [requestErrorMessage, setRequestErrorMessage] = useState("");
  const [mapKey, setMapKey] = useState(0);

  const [trackedRequests, setTrackedRequests] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [bookingMatchId, setBookingMatchId] = useState(null);
  const toast = useToast();

  const trackedUserId = useMemo(
    () => requestForm.userId || createdUserId || window.localStorage.getItem("ridesharing_user_id") || "",
    [requestForm.userId, createdUserId]
  );

  useEffect(() => {
    const userId = searchParams.get("userId");
    const requestedTab = searchParams.get("tab");

    if (requestedTab === "request") {
      setActiveTab("request");
    } else if (requestedTab === "register") {
      setActiveTab("register");
    }

    if (userId) {
      setRequestForm((current) => ({ ...current, userId }));
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadTrackedRequests() {
      if (!trackedUserId) {
        setTrackedRequests([]);
        setTrackingError("");
        return;
      }

      const storedRequestIds = getStoredRequestIds(trackedUserId);

      if (storedRequestIds.length === 0) {
        setTrackedRequests([]);
        setTrackingError("");
        return;
      }

      setTrackingLoading(true);
      setTrackingError("");

      try {
        const requestCards = await Promise.all(
          storedRequestIds.map(async (requestId) => {
            try {
              const request = await getRideRequest(requestId);
              const matches = await findRides(requestId);
              const topMatch = matches[0] || null;
              let matchedTrip = null;

              if (topMatch?.driverId && topMatch?.tripId) {
                const driverTrips = await getDriverTrips(topMatch.driverId);
                matchedTrip = driverTrips.find((trip) => Number(trip.id) === Number(topMatch.tripId)) || null;
              }

              return {
                request,
                matches,
                topMatch,
                matchedTrip
              };
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setTrackedRequests(
            requestCards
              .filter(Boolean)
              .sort((left, right) => new Date(right.request.time).getTime() - new Date(left.request.time).getTime())
          );
        }
      } catch (error) {
        if (!cancelled) {
          setTrackedRequests([]);
          setTrackingError(error.message);
        }
      } finally {
        if (!cancelled) {
          setTrackingLoading(false);
        }
      }
    }

    loadTrackedRequests();

    return () => {
      cancelled = true;
    };
  }, [trackedUserId, createdRequestId]);

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
    setRegisterErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleRequestChange(event) {
    const { name, value } = event.target;
    setRequestForm((current) => ({ ...current, [name]: value }));
    setRequestErrors((current) => ({ ...current, [name]: "" }));
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
      const response = await registerUser({
        ...registerForm,
        lat: DEFAULT_LOCATION?.lat,
        lng: DEFAULT_LOCATION?.lng
      });

      const nextUserId = String(response.id);
      window.localStorage.setItem("ridesharing_user_id", nextUserId);
      setCreatedUserId(nextUserId);
      setRegisterForm(registerInitialState);
      setRequestForm((current) => ({ ...current, userId: nextUserId }));
      toast.success("Rider registered", `User ID #${response.id} is ready.`);
    } catch (error) {
      setRegisterErrorMessage(error.message);
      toast.error("Registration failed", error.message);
    } finally {
      setRegisterLoading(false);
    }
  }

  async function submitRideRequest(nextForm) {
    const nextErrors = validateRequest(nextForm);

    if (Object.keys(nextErrors).length > 0) {
      setRequestErrors(nextErrors);
      return;
    }

    setRequestLoading(true);
    setRequestErrorMessage("");

    try {
      const response = await createRideRequest(nextForm);
      const nextUserId = String(nextForm.userId);
      const nextRequestId = String(response.id);
      window.localStorage.setItem("ridesharing_user_id", nextUserId);
      appendRequestId(nextUserId, nextRequestId);
      setCreatedRequestId(nextRequestId);
      setRequestForm({
        ...getRequestInitialState(),
        userId: nextUserId
      });
      setMapKey((current) => current + 1);
      toast.success("Ride request created", `Request #${response.id} is ready.`);
    } catch (error) {
      setRequestErrorMessage(error.message);
      toast.error("Request failed", error.message);
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleMapRideRequest(data) {
    const pickup = LOCATION_BY_ID[data.pickupId];
    const drop = LOCATION_BY_ID[data.dropId];

    if (!pickup || !drop) {
      toast.error("Unknown map location", "The selected route could not be translated.");
      return;
    }

    const nextForm = {
      ...requestForm,
      startLocation: data.pickupName,
      endLocation: data.dropName,
      startLat: pickup.x / 30,
      startLng: pickup.y / 30,
      endLat: drop.x / 30,
      endLng: drop.y / 30
    };

    setRequestForm(nextForm);
    await submitRideRequest(nextForm);
  }

  async function handleBook(matchId) {
    setBookingMatchId(matchId);

    try {
      await bookRide(matchId);
      setTrackedRequests((current) =>
        current.map((item) =>
          item.topMatch?.matchId === matchId
            ? {
                ...item,
                topMatch: {
                  ...item.topMatch,
                  status: "ACCEPTED"
                },
                matches: item.matches.map((match) =>
                  match.matchId === matchId ? { ...match, status: "ACCEPTED" } : match
                )
              }
            : item
        )
      );
      toast.success("Ride booked", `Match #${matchId} has been accepted.`);
    } catch (error) {
      toast.error("Booking failed", error.message);
    } finally {
      setBookingMatchId(null);
    }
  }

  async function refreshTrackedRequests() {
    if (!trackedUserId) return;
    setCreatedRequestId((current) => `${current}`);
    const storedRequestIds = getStoredRequestIds(trackedUserId);

    if (storedRequestIds.length === 0) {
      setTrackedRequests([]);
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");

    try {
      const requestCards = await Promise.all(
        storedRequestIds.map(async (requestId) => {
          try {
            const request = await getRideRequest(requestId);
            const matches = await findRides(requestId);
            const topMatch = matches[0] || null;
            let matchedTrip = null;

            if (topMatch?.driverId && topMatch?.tripId) {
              const driverTrips = await getDriverTrips(topMatch.driverId);
              matchedTrip = driverTrips.find((trip) => Number(trip.id) === Number(topMatch.tripId)) || null;
            }

            return {
              request,
              matches,
              topMatch,
              matchedTrip
            };
          } catch {
            return null;
          }
        })
      );

      setTrackedRequests(
        requestCards
          .filter(Boolean)
          .sort((left, right) => new Date(right.request.time).getTime() - new Date(left.request.time).getTime())
      );
    } catch (error) {
      setTrackedRequests([]);
      setTrackingError(error.message);
    } finally {
      setTrackingLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Rider</h1>
        </div>
      </section>

      <section className="form-shell page-stack">
        <div
          className="inline-actions"
          role="tablist"
          aria-label="Rider tabs"
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
            className={activeTab === "request" ? "button" : "ghost-button"}
            type="button"
            role="tab"
            aria-selected={activeTab === "request"}
            onClick={() => setActiveTab("request")}
          >
            Request Ride
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
            </div>

            {registerErrorMessage ? <div className="alert">{registerErrorMessage}</div> : null}
            {createdUserId ? <div className="glass-card">User ID #{createdUserId}</div> : null}

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
                label="User ID"
                name="userId"
                type="number"
                value={requestForm.userId}
                onChange={handleRequestChange}
                error={requestErrors.userId}
                required
              />
              <FormField
                label="Seats"
                name="seats"
                type="number"
                min="1"
                value={requestForm.seats}
                onChange={handleRequestChange}
                error={requestErrors.seats}
                required
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <FormField
                  label="Requested Time"
                  name="time"
                  type="datetime-local"
                  value={requestForm.time}
                  onChange={handleRequestChange}
                  error={requestErrors.time}
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
                  .rider-page-map .city-map__controls {
                    display: none;
                  }
                `}
              </style>
              <div className="rider-page-map">
                <CityMap key={mapKey} initialMode="rider" onRideRequest={handleMapRideRequest} />
              </div>
            </div>

            {requestErrors.startLocation || requestErrors.endLocation ? (
              <div className="alert">{requestErrors.startLocation || requestErrors.endLocation}</div>
            ) : null}
            {requestErrorMessage ? <div className="alert">{requestErrorMessage}</div> : null}
            {createdRequestId ? <div className="glass-card">Request ID #{createdRequestId}</div> : null}

            <div className="form-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setRequestErrors({});
                  setRequestErrorMessage("");
                  setRequestForm(getRequestInitialState());
                  setMapKey((current) => current + 1);
                }}
                disabled={requestLoading}
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
            <h2 className="section-title">Ride Tracking</h2>
          </div>
          <div className="inline-actions">
            <div className="glass-card">Tracking User ID #{trackedUserId || "-"}</div>
            <button className="ghost-button" type="button" onClick={refreshTrackedRequests} disabled={!trackedUserId || trackingLoading}>
              {trackingLoading ? "Refreshing..." : "Refresh Matches"}
            </button>
          </div>
        </div>

        {!trackedUserId ? (
          <div className="empty-state">
            <div>
              <h3>No rider selected</h3>
              <p className="section-copy">Register a rider or enter a user ID in Request Ride to track matches here.</p>
            </div>
          </div>
        ) : null}

        {trackedUserId && trackingError ? (
          <div className="alert">
            <h3>Could not load ride tracking</h3>
            <p>{trackingError}</p>
          </div>
        ) : null}

        {trackedUserId && !trackingLoading && !trackingError && trackedRequests.length === 0 ? (
          <div className="empty-state">
            <div>
              <h3>No ride requests yet</h3>
              <p className="section-copy">Create a ride request for this user ID and it will appear here with live match status.</p>
            </div>
          </div>
        ) : null}

        {trackedRequests.map((item) => (
          <div key={item.request.id} className="glass-card section-block">
            <div className="page-header">
              <div>
                <h3>Request #{item.request.id}</h3>
                <p className="section-copy">
                  Rider #{item.request.user?.id} {item.request.user?.name ? `• ${item.request.user.name}` : ""}
                </p>
              </div>
              <Badge status={item.topMatch ? item.topMatch.status : item.request.status} />
            </div>

            <div className="grid-3">
              <div className="metric-card">
                <span className="muted-label">Route</span>
                <h3>
                  {item.request.startLoc} → {item.request.endLoc}
                </h3>
              </div>
              <div className="metric-card">
                <span className="muted-label">Requested Time</span>
                <h3>{formatDateTime(item.request.time)}</h3>
              </div>
              <div className="metric-card">
                <span className="muted-label">Seats</span>
                <h3>{item.request.seats}</h3>
              </div>
            </div>

            {item.topMatch ? (
              <div className="glass-card section-block">
                <div className="page-header">
                  <div>
                    <h3>Matched Driver</h3>
                    <p className="section-copy">
                      Driver #{item.topMatch.driverId} • {item.topMatch.driverName}
                    </p>
                  </div>
                  <Badge status={item.topMatch.status} />
                </div>

                <div className="grid-4">
                  <div className="metric-card">
                    <span className="muted-label">Trip</span>
                    <h3>#{item.topMatch.tripId}</h3>
                  </div>
                  <div className="metric-card">
                    <span className="muted-label">Score</span>
                    <h3>{Number(item.topMatch.score || 0).toFixed(2)}</h3>
                  </div>
                  <div className="metric-card">
                    <span className="muted-label">Overlap</span>
                    <h3>{Math.round(item.topMatch.overlapPercentage || 0)}%</h3>
                  </div>
                  <div className="metric-card">
                    <span className="muted-label">Time Fit</span>
                    <h3>{Math.round(item.topMatch.timeCompatibility || 0)}%</h3>
                  </div>
                </div>

                {item.matchedTrip ? (
                  <div className="table-shell">
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Driver</th>
                            <th>Route</th>
                            <th>Time</th>
                            <th>Seats</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{item.topMatch.driverName}</td>
                            <td>
                              {item.matchedTrip.startLoc} → {item.matchedTrip.endLoc}
                            </td>
                            <td>
                              {formatDateTime(item.matchedTrip.startTime)} - {new Date(item.matchedTrip.endTime).toLocaleTimeString()}
                            </td>
                            <td>{item.matchedTrip.seats}</td>
                            <td>
                              <Badge status={item.matchedTrip.status} />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {item.topMatch.status !== "ACCEPTED" ? (
                  <div className="form-actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() => handleBook(item.topMatch.matchId)}
                      disabled={bookingMatchId === item.topMatch.matchId}
                    >
                      {bookingMatchId === item.topMatch.matchId ? "Booking..." : "Book This Ride"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">
                <div>
                  <h3>No driver matched yet</h3>
                  <p className="section-copy">This request is saved. When a suitable driver trip exists, Refresh Matches will show it here.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default RiderPage;
