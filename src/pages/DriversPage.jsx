import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/ToastContainer";
import { getDriver, getDriversDirectory, getDriverTrips } from "../services/api";

function DriversPage() {
  const { id } = useParams();
  const [drivers, setDrivers] = useState([]);
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      try {
        if (id) {
          const [driverData, tripData] = await Promise.all([getDriver(id), getDriverTrips(id)]);
          setDriver(driverData);
          setTrips(tripData);
        } else {
          const directory = await getDriversDirectory();
          setDrivers(directory);
        }
      } catch (error) {
        setErrorMessage(error.message);
        toast.error("Could not load drivers", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id, toast]);

  if (loading) {
    return <LoadingSkeleton type="card" count={id ? 2 : 3} />;
  }

  if (errorMessage) {
    return (
      <div className="page-stack">
        <div className="alert">
          <h3>Could not load driver information</h3>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!id && drivers.length === 0) {
    return (
      <div className="page-stack">
        <div className="empty-state empty-state--center">
          <div className="empty-state__icon">D</div>
          <div>
            <h3>No drivers in directory</h3>
            <p className="section-copy">Register a driver to start populating the directory view.</p>
          </div>
          <Link className="button" to="/driver-register">
            Register Driver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {!id ? (
        <>
          <section className="page-header">
            <div>
              <h1 className="page-title">Driver Directory</h1>
              <p className="page-copy">
                Browse available drivers, then drill into an individual profile to inspect their trip inventory.
              </p>
            </div>
          </section>

          <section className="directory-grid">
            {drivers.map((item) => (
              <article key={item.id} className="directory-card">
                <div className="directory-card__top">
                  <div className="avatar">
                    {item.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <Badge status="AVAILABLE" />
                </div>
                <h3>{item.name}</h3>
                <p className="section-copy">{item.email}</p>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="muted-label">Seats</span>
                    <strong>{item.seats}</strong>
                  </div>
                  <div className="summary-item">
                    <span className="muted-label">Location</span>
                    <strong>
                      {item.lat}, {item.lng}
                    </strong>
                  </div>
                </div>
                <div className="form-actions">
                  <Link className="button" to={`/drivers/${item.id}`}>
                    View Profile
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <>
          <section className="page-header">
            <div>
              <h1 className="page-title">Driver Profile</h1>
              <p className="page-copy">
                Detailed driver information with live trip records loaded from `/api/drivers/:id` and `/api/drivers/:id/trips`.
              </p>
            </div>
            <Link className="ghost-button" to="/drivers">
              Back to Directory
            </Link>
          </section>

          {!driver ? (
            <div className="empty-state empty-state--center">
              <div className="empty-state__icon">?</div>
              <div>
                <h3>Driver not found</h3>
                <p className="section-copy">The requested profile could not be loaded.</p>
              </div>
            </div>
          ) : (
            <section className="profile-grid">
              <div className="profile-shell">
                <div className="identity-row">
                  <div className="avatar">
                    {driver.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <h2>{driver.name}</h2>
                    <p className="section-copy">{driver.email}</p>
                  </div>
                </div>

                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="muted-label">Phone</span>
                    <strong>{driver.phone}</strong>
                  </div>
                  <div className="summary-item">
                    <span className="muted-label">Seats</span>
                    <strong>{driver.seats}</strong>
                  </div>
                  <div className="summary-item">
                    <span className="muted-label">Location</span>
                    <strong>
                      {driver.lat}, {driver.lng}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="table-shell">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Trip ID</th>
                        <th>Route</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Seats</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.length > 0 ? (
                        trips.map((trip) => (
                          <tr key={trip.id}>
                            <td>#{trip.id}</td>
                            <td>
                              {trip.startLoc} → {trip.endLoc}
                            </td>
                            <td>{new Date(trip.startTime).toLocaleString()}</td>
                            <td>{new Date(trip.endTime).toLocaleString()}</td>
                            <td>{trip.seats}</td>
                            <td>
                              <Badge status={trip.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">
                            <div className="empty-state empty-state--center">
                              <div className="empty-state__icon">T</div>
                              <div>
                                <h3>No trips for this driver</h3>
                                <p className="section-copy">Create a trip to populate the driver profile table.</p>
                              </div>
                              <Link className="button" to={`/trip-create?driverId=${driver.id}`}>
                                Create Trip
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default DriversPage;
