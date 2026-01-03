// app/components/Navbar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;
  const isActiveGroup = (path) => pathname.startsWith(path);

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/auth/login";
  };

  const initials = useMemo(() => {
    const name = user?.name || "";
    return name ? name.trim().charAt(0).toUpperCase() : "U";
  }, [user?.name]);

  const NavPill = ({ href, icon, label, active }) => (
    <Link
      href={href}
      className={`nav-link nav-pill d-flex align-items-center gap-2 ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </Link>
  );

  const DropdownPill = ({ icon, label, active, children, id }) => (
    <li className="nav-item dropdown">
      <a
        className={`nav-link nav-pill dropdown-toggle d-flex align-items-center gap-2 ${active ? "active" : ""}`}
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        id={id}
      >
        <i className={`bi ${icon}`} />
        <span>{label}</span>
      </a>
      <ul className="dropdown-menu dropdown-menu-dark nav-dropdown shadow-lg border-0" aria-labelledby={id}>
        {children}
      </ul>
    </li>
  );

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-modern sticky-top">
        <div className="container py-2">
          {/* Brand */}
          <Link href="/" className="navbar-brand d-flex align-items-center gap-3">
            <span className="brand-mark">
              <i className="bi bi-gem" />
            </span>
            <div className="d-flex flex-column lh-sm">
              <span className="brand-title">DiamondMS</span>
              <span className="brand-subtitle">Inventory • Sales • Records</span>
            </div>
          </Link>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-controls="navbarMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list text-white" style={{ fontSize: "1.6rem" }} />
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            {/* Left nav */}
            <ul className="navbar-nav ms-lg-4 me-auto gap-2 mt-3 mt-lg-0">
              <li className="nav-item">
                <NavPill href="/" icon="bi-grid-1x2-fill" label="Dashboard" active={isActive("/")} />
              </li>

              <DropdownPill
                id="navDiamonds"
                icon="bi-gem"
                label="Diamonds"
                active={isActiveGroup("/diamonds")}
              >
                <li>
                  <Link className="dropdown-item" href="/diamonds">
                    <i className="bi bi-collection me-2 text-primary" />
                    All Diamonds
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/diamonds/create">
                    <i className="bi bi-plus-circle me-2 text-success" />
                    Add New Diamond
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li className="dropdown-header">Filter</li>
                <li>
                  <Link className="dropdown-item" href="/diamonds?availability=available">
                    <i className="bi bi-check-circle me-2 text-success" />
                    Available
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/diamonds?availability=sold">
                    <i className="bi bi-bag-check me-2 text-info" />
                    Sold
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/diamonds?availability=memo">
                    <i className="bi bi-hourglass-split me-2 text-warning" />
                    Out on Memo
                  </Link>
                </li>
              </DropdownPill>

              <DropdownPill
                id="navSales"
                icon="bi-graph-up-arrow"
                label="Sales"
                active={isActiveGroup("/sales")}
              >
                <li>
                  <Link className="dropdown-item" href="/sales">
                    <i className="bi bi-list-ul me-2 text-primary" />
                    All Sales
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/sales/create">
                    <i className="bi bi-plus-circle me-2 text-success" />
                    New Sale
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li className="dropdown-header">Filter</li>
                <li>
                  <Link className="dropdown-item" href="/sales?status=pending">
                    <i className="bi bi-clock me-2 text-warning" />
                    Pending
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/sales?status=completed">
                    <i className="bi bi-check2-circle me-2 text-success" />
                    Completed
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/sales?status=cancelled">
                    <i className="bi bi-x-circle me-2 text-danger" />
                    Cancelled
                  </Link>
                </li>
              </DropdownPill>

              <li className="nav-item">
                <NavPill href="/clients" icon="bi-people-fill" label="Clients" active={isActiveGroup("/clients")} />
              </li>

              <li className="nav-item">
                <NavPill href="/brokers" icon="bi-person-badge-fill" label="Brokers" active={isActiveGroup("/brokers")} />
              </li>

              <li className="nav-item">
                <NavPill href="/expenses" icon="bi-receipt" label="Expenses" active={isActiveGroup("/expenses")} />
              </li>
            </ul>

            {/* Right side */}
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              {/* Auth */}
              {!user ? (
                <>
                  <Link href="/auth/login" className="btn btn-outline-light btn-auth">
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Login
                  </Link>
                  <Link href="/auth/register" className="btn btn-brand btn-auth">
                    <i className="bi bi-person-plus me-2" />
                    Register
                  </Link>
                </>
              ) : (
                <div className="dropdown">
                  <button className="btn btn-user dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <span className="user-avatar">{initials}</span>
                    <span className="d-none d-md-inline user-name">{user.name}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end nav-dropdown shadow-lg border-0">
                    <li className="dropdown-header">
                      <div className="fw-semibold">{user.name}</div>
                      <div className="text-muted small">{user.email}</div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2" />
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div className="nav-accent" />
      </nav>

      {/* Styles */}
      <style jsx global>{`
        .navbar-modern {
          background: rgba(15, 17, 23, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .nav-accent {
          height: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 30%, #0ea5e9 70%, #22c55e 100%);
          opacity: 0.9;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 10px 24px rgba(102, 126, 234, 0.22);
          font-size: 1.15rem;
        }
        .brand-title {
          color: #fff;
          font-weight: 800;
          letter-spacing: -0.3px;
        }
        .brand-subtitle {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.72rem;
        }

        .nav-pill {
          color: rgba(255, 255, 255, 0.78) !important;
          padding: 0.6rem 0.9rem !important;
          border-radius: 999px;
          transition: all 0.18s ease;
          background: transparent;
          border: 1px solid transparent;
        }
        .nav-pill i {
          opacity: 0.9;
        }
        .nav-pill:hover {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.10);
          transform: translateY(-1px);
        }
        .nav-pill.active {
          color: #fff !important;
          background: rgba(102, 126, 234, 0.22);
          border-color: rgba(102, 126, 234, 0.35);
        }

        .nav-dropdown {
          background: #1a1d24;
          border-radius: 14px;
          padding: 0.5rem;
          min-width: 240px;
        }
        .nav-dropdown .dropdown-item {
          color: rgba(255, 255, 255, 0.82);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
          transition: background 0.15s ease;
        }
        .nav-dropdown .dropdown-item:hover {
          background: rgba(102, 126, 234, 0.18);
          color: #fff;
        }
        .nav-dropdown .dropdown-divider {
          border-color: rgba(255, 255, 255, 0.08);
        }
        .nav-dropdown .dropdown-header {
          color: rgba(255, 255, 255, 0.55);
          padding: 0.4rem 0.75rem;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .btn-quickadd {
          border-radius: 999px;
          padding: 0.6rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.9);
          transition: all 0.18s ease;
        }
        .btn-quickadd:hover {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        .btn-auth {
          border-radius: 999px;
          padding: 0.6rem 1rem;
        }
        .btn-brand {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 10px 24px rgba(102, 126, 234, 0.22);
        }
        .btn-brand:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }

        .btn-user {
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.9);
        }
        .btn-user:hover {
          background: rgba(255, 255, 255, 0.10);
        }
        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.6rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-weight: 800;
        }
        .user-name {
          font-weight: 600;
        }

        .navbar-toggler:focus,
        .btn:focus,
        .dropdown-item:focus {
          box-shadow: none !important;
        }

        @media (max-width: 991.98px) {
          .navbar-collapse {
            margin-top: 12px;
            padding: 14px;
            background: rgba(26, 29, 36, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 16px;
          }
          .nav-dropdown {
            min-width: 100%;
          }
        }
      `}</style>
    </>
  );
}