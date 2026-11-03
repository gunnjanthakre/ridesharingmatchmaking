import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import { useToast } from "../components/ToastContainer";
import { getTripsDirectory } from "../services/api";

function formatDateRange(startTime, endTime) {
  const start = new Date(startTime).toLocaleString();
  const end = new Date(endTime).toLocaleTimeString();
  return `${start} - ${end}`;
}

function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  useEffect(() => {
    async function loadTrips() {
      try {
        const data = await getTripsDirectory();
        setTrips(data);
      } catch (error) {
        setErrorMessage(error.message);
        toast.error("Could not load trips", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, [toast]);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Trips</h1>
        </div>
      </section>

      <div className="table-shell">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Time</th>
                <th>Seats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Loading trips...</td>
                </tr>
              ) : null}

              {!loading && errorMessage ? (
                <tr>
                  <td colSpan="6">{errorMessage}</td>
                </tr>
              ) : null}

              {!loading && !errorMessage && trips.length === 0 ? (
                <tr>
                  <td colSpan="6">No trips available.</td>
                </tr>
              ) : null}

              {!loading && !errorMessage
                ? trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>#{trip.id}</td>
                      <td>{trip.driver?.name}</td>
                      <td>
                        {trip.startLoc} → {trip.endLoc}
                      </td>
                      <td>{formatDateRange(trip.startTime, trip.endTime)}</td>
                      <td>{trip.seats}</td>
                      <td>
                        <Badge status={trip.status} />
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TripsPage;
