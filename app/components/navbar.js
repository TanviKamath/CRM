// app/components/Navbar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();

  // Check active state
  const isActive = (path) => pathname === path;
  const isActiveGroup = (path) => pathname.startsWith(path);

  // Logged-in user
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/auth/login";
  };

  // Nav link style helper
  const getNavLinkStyle = (path, isGroup = false) => {
    const active = isGroup ? isActiveGroup(path) : isActive(path);
    return {
      color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
      backgroundColor: active ? "rgba(102, 126, 234, 0.2)" : "transparent",
      borderRadius: "8px",
      transition: "all 0.2s ease",
    };
  };

  return (
    <>
      <nav 
        className="navbar navbar-expand-lg sticky-top py-3"
        style={{ 
          backgroundColor: "#0f1117",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <div className="container">
          {/* Brand */}
          <Link href="/" className="navbar-brand d-flex align-items-center me-5">
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 me-3"
              style={{ 
                width: "42px", 
                height: "42px", 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
              }}
            >
              <i className="bi bi-gem text-white" style={{ fontSize: "1.2rem" }}></i>
            </div>
            <div>
              <span className="fw-bold text-white" style={{ fontSize: "1.25rem", letterSpacing: "-0.5px" }}>
                Diamond<span style={{ color: "#667eea" }}>MS</span>
              </span>
              <div className="text-muted" style={{ fontSize: "0.65rem", marginTop: "-2px" }}>
                Management System
              </div>
            </div>
          </Link>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler border-0 p-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
          >
            <i className="bi bi-list text-white" style={{ fontSize: "1.5rem" }}></i>
          </button>

          {/* Navbar Content */}
          <div className="collapse navbar-collapse" id="navbarMain">
            {/* Main Navigation */}
            <ul className="navbar-nav me-auto mb-3 mb-lg-0">
              {/* Dashboard */}
              <li className="nav-item me-1">
                <Link
                  href="/"
                  className="nav-link px-3 py-2 d-flex align-items-center"
                  style={getNavLinkStyle("/", false)}
                >
                  <i className="bi bi-grid-1x2-fill me-2" style={{ fontSize: "1rem" }}></i>
                  <span>Dashboard</span>
                </Link>
              </li>

              {/* Diamonds Dropdown */}
              <li className="nav-item dropdown me-1">
                <a
                  className="nav-link px-3 py-2 dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={getNavLinkStyle("/diamonds", true)}
                >
                  <i className="bi bi-gem me-2" style={{ fontSize: "1rem" }}></i>
                  <span>Diamonds</span>
                </a>
                <ul 
                  className="dropdown-menu border-0 shadow-lg mt-2 py-2"
                  style={{ 
                    backgroundColor: "#1a1d24",
                    borderRadius: "12px",
                    minWidth: "220px"
                  }}
                >
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/diamonds">
                      <i className="bi bi-collection me-2 text-primary"></i>
                      All Diamonds
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/diamonds/create">
                      <i className="bi bi-plus-lg me-2 text-success"></i>
                      Add New Diamond
                    </Link>
                  </li>
                  
                  <li className="my-2"><hr className="dropdown-divider mx-3" style={{ borderColor: "rgba(255,255,255,0.1)" }} /></li>
                  
                  {/* <li className="px-3 py-1">
                    <small className="text-muted text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>
                      Filter by Status
                    </small>
                  </li> */}
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/diamonds?availability=available">
                      <i className="bi bi-circle-fill me-2 text-success" style={{ fontSize: "0.5rem" }}></i>
                      Available
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/diamonds?availability=sold">
                      <i className="bi bi-circle-fill me-2 text-danger" style={{ fontSize: "0.5rem" }}></i>
                      Sold
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/diamonds?availability=memo">
                      <i className="bi bi-circle-fill me-2 text-warning" style={{ fontSize: "0.5rem" }}></i>
                      Out on Memo
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Sales Dropdown */}
              <li className="nav-item dropdown me-1">
                <a
                  className="nav-link px-3 py-2 dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={getNavLinkStyle("/sales", true)}
                >
                  <i className="bi bi-graph-up-arrow me-2" style={{ fontSize: "1rem" }}></i>
                  <span>Sales</span>
                </a>
                <ul 
                  className="dropdown-menu border-0 shadow-lg mt-2 py-2"
                  style={{ 
                    backgroundColor: "#1a1d24",
                    borderRadius: "12px",
                    minWidth: "220px"
                  }}
                >
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/sales">
                      <i className="bi bi-list-ul me-2 text-primary"></i>
                      All Sales
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/sales/create">
                      <i className="bi bi-plus-lg me-2 text-success"></i>
                      Record New Sale
                    </Link>
                  </li>
                  
                  <li className="my-2"><hr className="dropdown-divider mx-3" style={{ borderColor: "rgba(255,255,255,0.1)" }} /></li>
                  
                  {/* <li className="px-3 py-1">
                    <small className="text-muted text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>
                      Filter by Status
                    </small>
                  </li> */}
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/sales?status=pending">
                      <i className="bi bi-circle-fill me-2 text-warning" style={{ fontSize: "0.5rem" }}></i>
                      Pending
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/sales?status=completed">
                      <i className="bi bi-circle-fill me-2 text-success" style={{ fontSize: "0.5rem" }}></i>
                      Completed
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/sales?status=cancelled">
                      <i className="bi bi-circle-fill me-2 text-danger" style={{ fontSize: "0.5rem" }}></i>
                      Cancelled
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Clients Dropdown */}
              <li className="nav-item dropdown me-1">
                <a
                  className="nav-link px-3 py-2 dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={getNavLinkStyle("/clients", true)}
                >
                  <i className="bi bi-people-fill me-2" style={{ fontSize: "1rem" }}></i>
                  <span>Clients</span>
                </a>
                <ul 
                  className="dropdown-menu border-0 shadow-lg mt-2 py-2"
                  style={{ 
                    backgroundColor: "#1a1d24",
                    borderRadius: "12px",
                    minWidth: "200px"
                  }}
                >
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/clients">
                      <i className="bi bi-person-lines-fill me-2 text-primary"></i>
                      All Clients
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/clients/create">
                      <i className="bi bi-person-plus-fill me-2 text-success"></i>
                      Add New Client
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Brokers Dropdown */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link px-3 py-2 dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={getNavLinkStyle("/brokers", true)}
                >
                  <i className="bi bi-person-badge-fill me-2" style={{ fontSize: "1rem" }}></i>
                  <span>Brokers</span>
                </a>
                <ul 
                  className="dropdown-menu border-0 shadow-lg mt-2 py-2"
                  style={{ 
                    backgroundColor: "#1a1d24",
                    borderRadius: "12px",
                    minWidth: "200px"
                  }}
                >
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/brokers">
                      <i className="bi bi-person-vcard-fill me-2 text-primary"></i>
                      All Brokers
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3" href="/brokers/create">
                      <i className="bi bi-person-plus-fill me-2 text-success"></i>
                      Add New Broker
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>

            {/* Right Side - User */}
            <div className="d-flex align-items-center">
              {loading ? (
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : user ? (
                /* Logged In User */
                <div className="dropdown">
                  <button
                    className="btn d-flex align-items-center p-2 rounded-3"
                    type="button"
                    data-bs-toggle="dropdown"
                    style={{ 
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    {/* Avatar */}
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: "36px", 
                        height: "36px", 
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      }}
                    >
                      <span className="text-white fw-bold" style={{ fontSize: "0.9rem" }}>
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    
                    {/* Name */}
                    <div className="d-none d-md-block text-start mx-3">
                      <div className="text-white fw-medium" style={{ fontSize: "0.9rem", lineHeight: "1.2" }}>
                        {user.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                        {user.role || "User"}
                      </div>
                    </div>
                    
                    {/* Chevron */}
                    <i className="bi bi-chevron-down text-muted" style={{ fontSize: "0.75rem" }}></i>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <ul 
                    className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 py-2"
                    style={{ 
                      backgroundColor: "#1a1d24",
                      borderRadius: "12px",
                      minWidth: "200px"
                    }}
                  >
                    {/* User Info Header */}
                    <li className="px-3 py-2 mb-2">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ 
                            width: "45px", 
                            height: "45px", 
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                          }}
                        >
                          <span className="text-white fw-bold" style={{ fontSize: "1.1rem" }}>
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="text-white fw-medium">{user.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>{user.email}</div>
                        </div>
                      </div>
                    </li>
                    
                    <li><hr className="dropdown-divider mx-3" style={{ borderColor: "rgba(255,255,255,0.1)" }} /></li>
                    
                    {/* Logout */}
                    <li>
                      <button 
                        className="dropdown-item py-2 px-3 d-flex align-items-center text-danger"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                /* Not Logged In */
                <div className="d-flex align-items-center gap-3">
                  <Link
                    href="/auth/login"
                    className="btn px-4 py-2"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "rgba(255,255,255,0.8)",
                      borderRadius: "8px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn px-4 py-2"
                    style={{ 
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      color: "white",
                      borderRadius: "8px",
                      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
                    }}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Styles */}
      <style jsx global>{`
        /* Nav Links Hover */
        .navbar .nav-link:hover {
          color: #ffffff !important;
          background-color: rgba(102, 126, 234, 0.15) !important;
        }
        
        /* Dropdown Items */
        .dropdown-item {
          color: rgba(255, 255, 255, 0.8) !important;
          border-radius: 6px !important;
          margin: 2px 8px !important;
          width: calc(100% - 16px) !important;
          transition: all 0.2s ease !important;
        }
        
        .dropdown-item:hover {
          color: #ffffff !important;
          background-color: rgba(102, 126, 234, 0.2) !important;
        }
        
        .dropdown-item:active,
        .dropdown-item:focus {
          background-color: rgba(102, 126, 234, 0.3) !important;
        }
        
        /* Dropdown Toggle Arrow */
        .dropdown-toggle::after {
          margin-left: 0.5rem;
          vertical-align: middle;
          border-top-color: rgba(255, 255, 255, 0.5);
        }
        
        /* Remove focus outline */
        .navbar-toggler:focus,
        .btn:focus,
        .dropdown-item:focus {
          box-shadow: none !important;
          outline: none !important;
        }
        
        /* Mobile Responsive */
        @media (max-width: 991.98px) {
          .navbar-collapse {
            background-color: #1a1d24;
            padding: 1.5rem;
            margin-top: 1rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .navbar-nav .nav-item {
            margin-bottom: 0.25rem;
          }
          
          .navbar-nav .dropdown-menu {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border-radius: 8px !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            padding: 0.5rem !important;
          }
          
          .d-flex.align-items-center.gap-3 {
            flex-direction: column;
            width: 100%;
            gap: 0.75rem !important;
          }
          
          .d-flex.align-items-center.gap-3 .btn {
            width: 100%;
            justify-content: center;
          }
        }
        
        /* Button Hover States */
        .btn:hover {
          transform: translateY(-1px);
        }
        
        /* User Button Hover */
        .dropdown > .btn:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </>
  );
}