import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/ToastContainer";
import { getRideRequest } from "../services/api";

function RideRequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  useEffect(() => {
    async function loadRequest() {
      try {
        const data = await getRideRequest(id);
        setRequest(data);
      } catch (error) {
        setErrorMessage(error.message);
        toast.error("Could not load request", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadRequest();
  }, [id, toast]);

  if (loading) {
    return <LoadingSkeleton type="card" count={2} />;
  }

  if (errorMessage) {
    return (
      <div className="page-stack">
        <div className="alert">
          <h3>Could not load ride request</h3>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-stack">
        <div className="empty-state empty-state--center">
          <div className="empty-state__icon">Q</div>
          <div>
            <h3>Ride request not found</h3>
            <p className="section-copy">The requested ride detail could not be located.</p>
          </div>
          <Link className="button" to="/ride-request">
            Create a Request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Ride Request Detail</h1>
          <p className="page-copy">Full request context for rider #{request.user?.id}, ready for match review.</p>
        </div>
      </section>

      <section className="detail-grid">
        <div className="detail-panel">
          <span className="muted-label">Rider</span>
          <h3>{request.user?.name}</h3>
          <p className="section-copy">Request ID #{request.id}</p>
        </div>
        <div className="detail-panel">
          <span className="muted-label">Status</span>
          <div className="inline-actions">
            <Badge status={request.status} />
          </div>
        </div>
        <div className="detail-panel">
          <span className="muted-label">Route</span>
          <h3>
            {request.startLoc} → {request.endLoc}
          </h3>
          <p className="section-copy">
            {request.startLat}, {request.startLng} to {request.endLat}, {request.endLng}
          </p>
        </div>
        <div className="detail-panel">
          <span className="muted-label">Timing and seats</span>
          <h3>{new Date(request.time).toLocaleString()}</h3>
          <p className="section-copy">{request.seats} seat(s) requested</p>
        </div>
      </section>

      <div className="success-card">
        <h3>Ready for the next step</h3>
        <p className="section-copy">
          Move into the live hero page to run the engine, or inspect stored matches for this request.
        </p>
        <div className="success-actions">
          <Link className="button" to={`/matches?requestId=${request.id}`}>
            View Matches for this Request
          </Link>
          <Link className="text-button" to={`/match-history?requestId=${request.id}`}>
            Open Match History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RideRequestDetailPage;
