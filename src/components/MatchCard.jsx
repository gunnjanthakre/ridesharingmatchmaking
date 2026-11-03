import Badge from "./Badge";

function formatPercent(value) {
  if (value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  return `${Math.round(value)}%`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MatchCard({ match, isTopRanked = false, onBook, booking = false }) {
  const overlapValue = match.overlapPercentage <= 1 ? match.overlapPercentage * 100 : match.overlapPercentage;
  const timeValue = match.timeCompatibility <= 1 ? match.timeCompatibility * 100 : match.timeCompatibility;

  return (
    <article className={`match-card ${isTopRanked ? "match-card--top" : ""}`}>
      {isTopRanked ? <div className="match-card__ribbon">Top Ranked</div> : null}

      <div className="match-card__top">
        <div className="identity-row">
          <div className="avatar">{getInitials(match.driverName)}</div>
          <div>
            <h3>{match.driverName}</h3>
            <div className="identity-meta">
              <span>Match #{match.matchId}</span>
              <span>Driver #{match.driverId}</span>
              <span>Trip #{match.tripId}</span>
            </div>
          </div>
        </div>

        <div className="score-pill">
          <small>Composite Score</small>
          <strong>{match.score.toFixed(2)}</strong>
        </div>
      </div>

      <div className="match-card__metrics">
        <div className="metric-bar">
          <div className="metric-bar__header">
            <span>Route overlap</span>
            <strong>{formatPercent(match.overlapPercentage)}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.min(overlapValue, 100)}%` }} />
          </div>
        </div>

        <div className="metric-bar">
          <div className="metric-bar__header">
            <span>Time compatibility</span>
            <strong>{formatPercent(match.timeCompatibility)}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.min(timeValue, 100)}%` }} />
          </div>
        </div>

        <div className="metric-bar">
          <div className="metric-bar__header">
            <span>Detour distance</span>
            <strong>{match.detourDistance.toFixed(1)} km</strong>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(18, 100 - Math.min(match.detourDistance * 22, 85))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="match-card__footer">
        <div className="inline-actions">
          <Badge status={match.status} />
          <span className="subtle-text">Request #{match.rideRequestId}</span>
        </div>

        <button
          className="button"
          type="button"
          disabled={booking || match.status === "ACCEPTED"}
          onClick={() => onBook?.(match)}
        >
          {booking ? "Booking..." : match.status === "ACCEPTED" ? "Booked" : "Book Ride"}
        </button>
      </div>
    </article>
  );
}

export default MatchCard;
