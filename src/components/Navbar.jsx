import { NavLink, Link } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/rider", label: "Rider" },
  { to: "/driver", label: "Driver" },
  { to: "/trips", label: "Trips" }
];

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="brand" to="/">
          <div className="brand__mark">RM</div>
          <div className="brand__text">
            <strong>RideMesh</strong>
            <span>Algorithmic ride pairing</span>
          </div>
        </Link>

        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink key={item.to} className="nav-link" to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
