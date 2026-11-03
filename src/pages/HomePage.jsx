import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSkeleton from "../components/LoadingSkeleton";

const signals = [
  {
    title: "Route overlap",
    copy: "Measure how closely a traveller journey sits on top of an active driver path."
  },
  {
    title: "Proximity",
    copy: "Prefer nearby pickups so travellers do not wait far away from the chosen route."
  },
  {
    title: "Time compatibility",
    copy: "Keep timing practical by comparing requested departure windows against trip schedules."
  },
  {
    title: "Seat availability",
    copy: "Only match travellers onto trips with enough remaining seats."
  }
];

function HomePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 240);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return <LoadingSkeleton type="hero" />;
  }

  return (
    <div className="page-stack container">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <h1>Intelligent ride matching</h1>
            <div className="hero-actions">
              <Link className="button" to="/rider">
                I need a ride
              </Link>
              <Link className="ghost-button" to="/driver">
                I&apos;m a driver
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card section-block">
        <div className="signal-grid">
          {signals.map((signal) => (
            <article key={signal.title} className="metric-card">
              <span className="muted-label">Signal</span>
              <h3>{signal.title}</h3>
              <p>{signal.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
