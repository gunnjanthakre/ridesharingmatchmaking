import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../components/FormField";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/ToastContainer";
import { locationCatalog } from "../data/locationCatalog";
import { registerUser } from "../services/api";

const initialState = {
  name: "",
  email: "",
  phone: "",
  location: ""
};

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email.";
  if (!/^[+\d\s-]{8,}$/.test(values.phone)) errors.phone = "Enter a valid phone number.";
  if (!values.location) errors.location = "Choose your current area.";
  return errors;
}

function RiderRegisterPage() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
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
      const response = await registerUser(form);
      setCreatedUser(response);
      window.localStorage.setItem("ridesharing_user_id", String(response.id));
      toast.success("Traveller registered", `Traveller ID #${response.id} is ready for ride requests.`);
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
          <h1 className="page-title">Traveller Registration</h1>
          <p className="page-copy">
            Create a traveller account with your current area instead of entering latitude and longitude manually.
          </p>
        </div>
      </section>

      <section className="grid-2">
        <form className="form-shell" onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Gunjan Patel" required />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="gunjan@example.com" required />
            <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+91 9876543210" required />
            <FormField label="Current Area" name="location" value={form.location} onChange={handleChange} error={errors.location} options={locationCatalog} required />
          </div>

          {errorMessage ? (
            <div className="alert">
              <h3>Could not register traveller</h3>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="form-actions">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Traveller"}
            </button>
            <button className="ghost-button" type="button" onClick={() => setForm(initialState)} disabled={loading}>
              Reset
            </button>
          </div>
        </form>

        <div className="page-stack">
          {loading ? <LoadingSkeleton type="card" /> : null}

          {createdUser ? (
            <div className="success-card">
              <h3>Traveller created successfully</h3>
              <p className="section-copy">Traveller ID #{createdUser.id} is now saved locally for the next ride request.</p>
              <div className="success-actions">
                <Link className="button" to={`/ride-request?userId=${createdUser.id}`}>
                  Request a Ride
                </Link>
                <Link className="text-button" to="/traveller">
                  Traveller Portal
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">R</div>
              <div>
                <h3>No traveller created yet</h3>
                <p className="section-copy">
                  Registration is now area-based, so normal users can finish it quickly without any map data.
                </p>
              </div>
            </div>
          )}

          <div className="glass-card">
            <span className="muted-label">Simplified input</span>
            <h3>Area to coordinates happens automatically</h3>
            <p className="section-copy">
              The frontend converts the selected area into backend coordinates before sending the API request.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RiderRegisterPage;
