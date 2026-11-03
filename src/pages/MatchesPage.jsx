import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CityMap, { buildCityGraph, buildRouteFromLocations } from "../components/CityMap";
import LoadingSkeleton from "../components/LoadingSkeleton";
import MatchCard from "../components/MatchCard";
import { useToast } from "../components/ToastContainer";
import { bookRide, findRides, getDriverTrips, getRideRequest } from "../services/api";

function sortMatches(matches, sortBy) {
  const sorted = [...matches];

  sorted.sort((left, right) => {
    if (sortBy === "overlapPercentage") {
      return right.overlapPercentage - left.overlapPercentage;
    }

    if (sortBy === "timeCompatibility") {
      return right.timeCompatibility - left.timeCompatibility;
    }

    return right.score - left.score;
  });

  return sorted;
}

function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRequestId = searchParams.get("requestId") || "";
  const [requestId, setRequestId] = useState(searchParams.get("requestId") || "");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(Boolean(searchParams.get("requestId")));
  const [errorMessage, setErrorMessage] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [bookingId, setBookingId] = useState(null);
  const [previewRouteData, setPreviewRouteData] = useState({
    rider: null,
    driver: null
  });
  const toast = useToast();
  const cityGraph = useMemo(() => buildCityGraph(), []);

  async function loadMatches(activeRequestId) {
    if (!activeRequestId) {
      setMatches([]);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await findRides(activeRequestId);
      setMatches(sortMatches(data, sortBy));
      if (data.length === 0) {
        toast.error("No matches found", `No stored or generated matches were returned for request #${activeRequestId}.`);
      }
    } catch (error) {
      setErrorMessage(error.message);
      setMatches([]);
      toast.error("Could not load matches", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const paramRequestId = searchParams.get("requestId") || "";
    setRequestId(paramRequestId);
    loadMatches(paramRequestId);
  }, [searchParams]);

  const filteredMatches = useMemo(() => {
    const filtered = matches.filter((match) =>
      match.driverName.toLowerCase().includes(driverFilter.trim().toLowerCase())
    );

    return sortMatches(filtered, sortBy);
  }, [matches, driverFilter, sortBy]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!activeRequestId) {
        setPreviewRouteData({ rider: null, driver: null });
        return;
      }

      try {
        const rideRequest = await getRideRequest(activeRequestId);
        if (cancelled) return;

        const riderRoute =
          buildRouteFromLocations(cityGraph, rideRequest.startLoc, rideRequest.endLoc) ||
          null;

        const topMatch = filteredMatches[0];
        let driverRoute = null;

        if (topMatch?.driverId && topMatch?.tripId) {
          const trips = await getDriverTrips(topMatch.driverId);
          if (cancelled) return;

          const matchedTrip = trips.find((trip) => Number(trip.id) === Number(topMatch.tripId));
          if (matchedTrip) {
            driverRoute = buildRouteFromLocations(cityGraph, matchedTrip.startLoc, matchedTrip.endLoc);
            if (driverRoute) {
              driverRoute = {
                ...driverRoute,
                startName: matchedTrip.startLoc,
                endName: matchedTrip.endLoc
              };
            }
          }
        }

        setPreviewRouteData({
          rider: riderRoute
            ? {
                pickupName: rideRequest.startLoc,
                dropName: rideRequest.endLoc,
                path: riderRoute.path,
                distance: riderRoute.distance
              }
            : null,
          driver: driverRoute
            ? {
                startName: driverRoute.startName,
                endName: driverRoute.endName,
                path: driverRoute.path,
                distance: driverRoute.distance
              }
            : null
        });
      } catch (error) {
        if (!cancelled) {
          setPreviewRouteData({ rider: null, driver: null });
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [activeRequestId, cityGraph, filteredMatches]);

  const stats = useMemo(() => {
    if (filteredMatches.length === 0) {
      return {
        total: 0,
        bestScore: "0.00",
        bestTimeFit: "0%"
      };
    }

    const bestScore = Math.max(...filteredMatches.map((match) => match.score));
    const bestTimeFit = Math.max(...filteredMatches.map((match) => match.timeCompatibility));

    return {
      total: filteredMatches.length,
      bestScore: bestScore.toFixed(2),
      bestTimeFit: `${Math.round(bestTimeFit)}%`
    };
  }, [filteredMatches]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSearchParams(requestId ? { requestId } : {});
  }

  async function handleBook(match) {
    setBookingId(match.matchId);

    try {
      await bookRide(match.matchId);
      setMatches((current) =>
        current.map((item) =>
          item.matchId === match.matchId
            ? {
                ...item,
                status: "ACCEPTED"
              }
            : item
        )
      );
      toast.success("Ride booked", `Match #${match.matchId} has been accepted.`);
    } catch (error) {
      toast.error("Booking failed", error.message);
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div className="page-stack match-hero">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Hero page</span>
            <h1>Ranked matches that explain why a ride is worth booking.</h1>
            <p>
              Run the engine, compare every candidate visually, and book the strongest fit without leaving the page.
            </p>

            <form className="toolbar" onSubmit={handleSubmit}>
              <div className="toolbar-row">
                <div className="field">
                  <label htmlFor="match-request-id">Ride request ID</label>
                  <input
                    id="match-request-id"
                    name="requestId"
                    type="number"
                    value={requestId}
                    onChange={(event) => setRequestId(event.target.value)}
                    placeholder="401"
                  />
                </div>
                <button className="button" type="submit">
                  Run Matchmaking
                </button>
              </div>
            </form>
          </div>

          <div className="visual-panel">
            <div className="muted-label">What this page surfaces</div>
            <div className="steps">
              <div className="step">
                <div className="step__index">1</div>
                <div>
                  <h3>Ranked by score</h3>
                  <p className="section-copy">Top candidate gets premium emphasis automatically.</p>
                </div>
              </div>
              <div className="step">
                <div className="step__index">2</div>
                <div>
                  <h3>Signal transparency</h3>
                  <p className="section-copy">Overlap, timing, and detour are visible at a glance.</p>
                </div>
              </div>
              <div className="step">
                <div className="step__index">3</div>
                <div>
                  <h3>One-click booking</h3>
                  <p className="section-copy">Booking updates the chosen card instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-row">
        <article className="stat-card">
          <span className="muted-label">Total matches</span>
          <div className="stat-card__value">{stats.total}</div>
        </article>
        <article className="stat-card">
          <span className="muted-label">Best score</span>
          <div className="stat-card__value">{stats.bestScore}</div>
        </article>
        <article className="stat-card">
          <span className="muted-label">Best time fit</span>
          <div className="stat-card__value">{stats.bestTimeFit}</div>
        </article>
      </section>

      {activeRequestId && (previewRouteData.rider || previewRouteData.driver) ? (
        <section className="glass-card">
          <span className="muted-label">Graph proof</span>
          <h3>Why the top match scores well</h3>
          <p className="section-copy">
            The canvas below reconstructs the rider request and the top matched driver trip on the same 30x30 graph, then highlights the shared route in violet.
          </p>
          <CityMap
            compact
            readOnly
            existingRiderPath={previewRouteData.rider || undefined}
            existingDriverRoute={previewRouteData.driver || undefined}
          />
        </section>
      ) : null}

      <section className="toolbar">
        <div className="toolbar-row">
          <div className="field">
            <label htmlFor="driver-filter">Search by driver</label>
            <input
              id="driver-filter"
              type="text"
              value={driverFilter}
              onChange={(event) => setDriverFilter(event.target.value)}
              placeholder="Search Aman, Riya, Kunal..."
            />
          </div>

          <div className="field">
            <label htmlFor="sort-by">Sort by</label>
            <select id="sort-by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="score">Score</option>
              <option value="overlapPercentage">Overlap percentage</option>
              <option value="timeCompatibility">Time compatibility</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? <LoadingSkeleton type="card" count={3} /> : null}

      {!loading && errorMessage ? (
        <div className="alert">
          <h3>Could not load match results</h3>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {!loading && !errorMessage && !requestId ? (
        <div className="empty-state empty-state--center">
          <div className="empty-state__icon">M</div>
          <div>
            <h3>Enter a request ID to begin</h3>
            <p className="section-copy">
              This page runs the backend matchmaking engine on demand using `/api/rides/findRides`.
            </p>
          </div>
          <div className="success-actions">
            <button className="button" type="button" onClick={() => setSearchParams({ requestId: "401" })}>
              Load Sample Request
            </button>
            <Link className="text-button" to="/ride-request">
              Create New Request
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !errorMessage && requestId && filteredMatches.length === 0 ? (
        <div className="empty-state empty-state--center">
          <div className="empty-state__icon">0</div>
          <div>
            <h3>No matches available yet</h3>
            <p className="section-copy">
              Try generating results again, adjust the request ID, or submit a fresh ride request.
            </p>
          </div>
          <div className="success-actions">
            <button className="button" type="button" onClick={() => loadMatches(requestId)}>
              Generate Matches
            </button>
            <Link className="text-button" to="/ride-request">
              Open Ride Request Form
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && filteredMatches.length > 0 ? (
        <section className="match-grid">
          {filteredMatches.map((match, index) => (
            <MatchCard
              key={match.matchId}
              match={match}
              isTopRanked={index === 0}
              booking={bookingId === match.matchId}
              onBook={handleBook}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export default MatchesPage;
