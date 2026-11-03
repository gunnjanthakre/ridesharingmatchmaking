import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import LoadingSkeleton from "../components/LoadingSkeleton";
import MatchCard from "../components/MatchCard";
import { useToast } from "../components/ToastContainer";
import { getRequestMatches } from "../services/api";

function MatchHistoryPage() {
  const [searchParams] = useSearchParams();
  const [requestId, setRequestId] = useState(searchParams.get("requestId") || "");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  async function loadHistory(targetRequestId) {
    if (!targetRequestId) {
      setErrorMessage("Enter a request ID first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getRequestMatches(targetRequestId);
      setMatches(data);
      if (data.length === 0) {
        toast.error("No stored matches", `No historical matches were found for request #${targetRequestId}.`);
      }
    } catch (error) {
      setMatches([]);
      setErrorMessage(error.message);
      toast.error("Could not load history", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialRequestId = searchParams.get("requestId") || "";
    if (initialRequestId) {
      setRequestId(initialRequestId);
      loadHistory(initialRequestId);
    }
  }, [searchParams]);

  async function handleSubmit(event) {
    event.preventDefault();
    await loadHistory(requestId);
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Match History</h1>
          <p className="page-copy">
            Load all stored matches for a request and inspect the same premium card treatment used on the live hero page.
          </p>
        </div>
      </section>

      <form className="toolbar" onSubmit={handleSubmit}>
        <div className="toolbar-row">
          <div className="field">
            <label htmlFor="history-request-id">Ride request ID</label>
            <input
              id="history-request-id"
              type="number"
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              placeholder="401"
            />
          </div>
          <button className="button" type="submit">
            Load History
          </button>
        </div>
      </form>

      {loading ? <LoadingSkeleton type="card" count={2} /> : null}

      {!loading && errorMessage ? (
        <div className="alert">
          <h3>Could not load match history</h3>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {!loading && !errorMessage && matches.length === 0 ? (
        <div className="empty-state empty-state--center">
          <div className="empty-state__icon">H</div>
          <div>
            <h3>No match history loaded</h3>
            <p className="section-copy">
              Enter a request ID to fetch stored match responses from the backend.
            </p>
          </div>
          <div className="success-actions">
            <button className="button" type="button" onClick={() => setRequestId("401")}>
              Use Sample ID
            </button>
            <Link className="text-button" to="/matches?requestId=401">
              Open Live Match Hero
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && matches.length > 0 ? (
        <div className="match-grid">
          {matches.map((match, index) => (
            <MatchCard key={match.matchId} match={match} isTopRanked={index === 0} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default MatchHistoryPage;
