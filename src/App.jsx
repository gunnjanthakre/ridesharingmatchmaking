import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/ToastContainer";
import HomePage from "./pages/HomePage";
import DriverPage from "./pages/DriverPage";
import RiderPage from "./pages/RiderPage";
import TripsPage from "./pages/TripsPage";

function LegacyRiderRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  if (location.pathname === "/ride-request") {
    params.set("tab", "request");
  } else if (location.pathname === "/rider-register") {
    params.set("tab", "register");
  }

  const search = params.toString();
  return <Navigate to={`/rider${search ? `?${search}` : ""}`} replace />;
}

function LegacyDriverRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  if (location.pathname === "/trip-create") {
    params.set("tab", "trip");
  } else if (location.pathname === "/driver-register") {
    params.set("tab", "register");
  }

  const search = params.toString();
  return <Navigate to={`/driver${search ? `?${search}` : ""}`} replace />;
}

function App() {
  return (
    <ToastProvider>
      <div className="app-shell">
        <div className="app-shell__aurora app-shell__aurora--left" />
        <div className="app-shell__aurora app-shell__aurora--right" />
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rider" element={<RiderPage />} />
            <Route path="/driver" element={<DriverPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/traveller" element={<LegacyRiderRedirect />} />
            <Route path="/ride-request" element={<LegacyRiderRedirect />} />
            <Route path="/rider-register" element={<LegacyRiderRedirect />} />
            <Route path="/driver-register" element={<LegacyDriverRedirect />} />
            <Route path="/trip-create" element={<LegacyDriverRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
