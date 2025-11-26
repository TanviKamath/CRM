"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();

  // Fix active state (ignores query strings)
  const isActive = (path) => pathname.startsWith(path);

  // Logged-in user
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/auth/login";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">

        {/* Brand */}
        <Link href="/" className="navbar-brand">
          Diamond Merchant System
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">

            {/* Dashboard */}
            <li className="nav-item">
              <Link
                href="/"
                className={`nav-link ${pathname === "/" ? "active" : ""}`}
              >
                <i className="bi bi-speedometer2"></i> Dashboard
              </Link>
            </li>

            {/* Diamonds */}
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${
                  isActive("/diamonds") ? "active" : ""
                }`}
                href="#"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-gem"></i> Diamonds
              </a>

              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" href="/diamonds">All Diamonds</Link></li>
                <li><Link className="dropdown-item" href="/diamonds/create">Add New Diamond</Link></li>

                <li><hr className="dropdown-divider" /></li>

                <li><Link className="dropdown-item" href="/diamonds?availability=available">Available</Link></li>
                <li><Link className="dropdown-item" href="/diamonds?availability=sold">Sold</Link></li>
                <li><Link className="dropdown-item" href="/diamonds?availability=memo">Out on Memo</Link></li>
              </ul>
            </li>

            {/* Sales */}
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${
                  isActive("/sales") ? "active" : ""
                }`}
                href="#"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-cash-coin"></i> Sales
              </a>

              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" href="/sales">All Sales</Link></li>
                <li><Link className="dropdown-item" href="/sales/create">New Sale</Link></li>

                <li><hr className="dropdown-divider" /></li>

                <li><Link className="dropdown-item" href="/sales?status=pending">Pending</Link></li>
                <li><Link className="dropdown-item" href="/sales?status=completed">Completed</Link></li>
                <li><Link className="dropdown-item" href="/sales?status=cancelled">Cancelled</Link></li>
              </ul>
            </li>

            {/* Clients */}
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${
                  isActive("/clients") ? "active" : ""
                }`}
                href="#"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-people"></i> Clients
              </a>

              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" href="/clients">All Clients</Link></li>
                <li><Link className="dropdown-item" href="/clients/create">Add New Client</Link></li>
              </ul>
            </li>

            {/* Brokers */}
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${
                  isActive("/brokers") ? "active" : ""
                }`}
                href="#"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-badge"></i> Brokers
              </a>

              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" href="/brokers">All Brokers</Link></li>
                <li><Link className="dropdown-item" href="/brokers/create">Add New Broker</Link></li>
              </ul>
            </li>

          </ul>

          {/* Right Side — Login or User */}
          <ul className="navbar-nav">

            {/* If not logged in */}
            {!user && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/auth/login") ? "active" : ""}`}
                    href="/auth/login"
                  >
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/auth/register") ? "active" : ""}`}
                    href="/auth/register"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}

            {/* If logged in */}
            {user && (
              <>
                <li className="nav-item">
                  <span className="nav-link">Hello, {user.name}</span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-danger btn-sm ms-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}

          </ul>

        </div>
      </div>
    </nav>
  );
}
