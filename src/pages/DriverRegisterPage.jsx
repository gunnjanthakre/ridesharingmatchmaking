import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../components/FormField";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/ToastContainer";
import { locationCatalog } from "../data/locationCatalog";
import { registerDriver } from "../services/api";

const initialState = {
  name: "",
  email: "",
  phone: "",
  location: "",
  seats: ""
};

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email.";
  if (!/^[+\d\s-]{8,}$/.test(values.phone)) errors.phone = "Enter a valid phone number.";
  if (!values.location) errors.location = "Choose your current area.";
  if (!values.seats || Number(values.seats) <= 0) errors.seats = "Seats must be greater than zero.";
  return errors;
}

function DriverRegisterPage() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdDriver, setCreatedDriver] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await registerDriver(form);
      setCreatedDriver(response);
      window.localStorage.setItem("ridesharing_driver_id", String(response.id));
      toast.success("Driver registered", `Driver ID #${response.id} can create trips now.`);
      setForm(initialState);
    } catch (error) {
      setErrorMessage(error.message);
      toast.error("Registration failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Driver Registration</h1>
          <p className="page-copy">
            Register as a driver with one area selection, seat count, and no coordinate guessing.
          </p>
        </div>
      </section>

      <section className="grid-2">
        <form className="form-shell" onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Aman Verma" required />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="aman@example.com" required />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+91 9123456780" required />
            <FormField label="Current Area" name="location" value={form.location} onChange={handleChange} error={errors.location} options={locationCatalog} required />
            <FormField label="Seats" name="seats" type="number" min="1" value={form.seats} onChange={handleChange} error={errors.seats} placeholder="3" required />
          </div>

          {errorMessage ? (
            <div className="alert">
              <h3>Could not register driver</h3>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="form-actions">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Driver"}
            </button>
            <button className="ghost-button" type="button" onClick={() => setForm(initialState)} disabled={loading}>
              Reset
            </button>
          </div>
        </form>

        <div className="page-stack">
          {loading ? <LoadingSkeleton type="card" /> : null}

          {createdDriver ? (
            <div className="success-card">
              <h3>Driver created successfully</h3>
              <p className="section-copy">Driver ID #{createdDriver.id} is now saved locally for the next trip setup.</p>
              <div className="success-actions">
                <Link className="button" to={`/trip-create?driverId=${createdDriver.id}`}>
                  Create a Trip
                </Link>
                <Link className="text-button" to="/driver">
                  Driver Portal
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">D</div>
              <div>
                <h3>No driver created yet</h3>
                <p className="section-copy">
                  The driver flow now asks only for identity, current area, and seats before moving on.
                </p>
              </div>
            </div>
          )}

          <div className="glass-card">
            <span className="muted-label">Route-first setup</span>
            <h3>Keep the driver journey fast</h3>
            <p className="section-copy">
              Once a driver is registered, the portal can send them straight to route creation using the saved ID.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DriverRegisterPage;
