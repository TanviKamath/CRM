// app/components/Navbar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navRef = useRef(null);
  const dropdownTimeout = useRef(null);

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = useCallback((path) => pathname === path, [pathname]);
  const isActiveGroup = useCallback((path) => pathname.startsWith(path), [pathname]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile & dropdown on route change
  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/auth/login";
  };

  const initials = useMemo(() => {
    const n = user?.name || "";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return n ? n.charAt(0).toUpperCase() : "U";
  }, [user?.name]);

  const toggleDropdown = useCallback((id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  }, []);

  const openDropdown = useCallback((id) => {
    clearTimeout(dropdownTimeout.current);
    setActiveDropdown(id);
  }, []);

  const scheduleClose = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 180);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(dropdownTimeout.current);
  }, []);

  const pro = user?.subscription === "Pro";

  /* ── nav config ── */
  const navItems = useMemo(() => {
    const items = [];

    if (user) {
      items.push({ type: "link", href: "/", icon: "bi-grid-1x2-fill", label: "Dashboard", active: isActive("/") });
      items.push({
        type: "dropdown",
        id: "diamonds",
        icon: "bi-gem",
        label: "Diamonds",
        active: isActiveGroup("/diamonds"),
        sections: [
          {
            items: [
              { href: "/diamonds", icon: "bi-collection", label: "All Diamonds", color: "#0071e3" },
              { href: "/diamonds/stock", icon: "bi-box-seam", label: "Stock Maintenance", color: "#5ac8fa" },
              { href: "/diamonds/create", icon: "bi-plus-circle", label: "Add Diamond", color: "#34c759" },
            ],
          },
          {
            title: "Filter by Status",
            items: [
              { href: "/diamonds?availability=available", icon: "bi-check-circle", label: "Available", color: "#34c759" },
              { href: "/diamonds?availability=sold", icon: "bi-bag-check", label: "Sold", color: "#0071e3" },
              { href: "/diamonds?availability=memo", icon: "bi-hourglass-split", label: "On Memo", color: "#ff9f0a" },
            ],
          },
        ],
      });

      items.push({
        type: "dropdown",
        id: "sales",
        icon: "bi-graph-up-arrow",
        label: "Sales",
        active: isActiveGroup("/sales"),
        sections: [
          {
            items: [
              { href: "/sales", icon: "bi-list-ul", label: "All Sales", color: "#0071e3" },
              { href: "/sales/create", icon: "bi-plus-circle", label: "New Sale", color: "#34c759" },
            ],
          },
          {
            title: "Filter by Status",
            items: [
              { href: "/sales?status=pending", icon: "bi-clock", label: "Pending", color: "#ff9f0a" },
              { href: "/sales?status=completed", icon: "bi-check2-circle", label: "Completed", color: "#34c759" },
              { href: "/sales?status=cancelled", icon: "bi-x-circle", label: "Cancelled", color: "#ff3b30" },
            ],
          },
        ],
      });

      items.push({
        type: "dropdown",
        id: "kyc",
        icon: "bi-people-fill",
        label: "KYC",
        active: isActiveGroup("/clients") || isActiveGroup("/brokers"),
        sections: [
          {
            items: [
              { href: "/clients", icon: "bi-person-fill", label: "Clients", color: "#0071e3" },
              { href: "/brokers", icon: "bi-person-badge-fill", label: "Brokers", color: "#5ac8fa" },
            ],
          },
        ],
      });

      items.push({
        type: "dropdown",
        id: "accounting",
        icon: "bi-receipt",
        label: "Accounting",
        active: isActiveGroup("/accounts") || isActiveGroup("/expenses") || isActiveGroup("/reporting"),
        sections: [
          {
            items: [
              { href: "/accounts", icon: "bi-wallet2", label: "Accounts", color: "#34c759" },
              { href: "/expenses", icon: "bi-cash-stack", label: "Expenses", color: "#ff3b30" },
            ],
          },
        ],
      });

      if (pro) {
        items.push({
          type: "link",
          href: "/excel-tool",
          icon: "bi-file-earmark-spreadsheet",
          label: "Excel Tool",
          active: isActive("/excel-tool"),
        });
      }
    }

    return items;
  }, [pathname, user, pro, isActive, isActiveGroup]);

  // Don't render dynamic/user-specific content until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <>
        <nav className="apple-nav">
          <div className="nav-inner">
            <Link href="/" className="nav-brand">
              <span className="brand-icon">
                <i className="bi bi-gem" />
              </span>
              <span className="brand-text">
                <span className="brand-name">DiamondMS</span>
                <span className="brand-sub">Management System</span>
              </span>
            </Link>
          </div>
        </nav>
        <style dangerouslySetInnerHTML={{ __html: navStyles }} />
      </>
    );
  }

  return (
    <>
      <nav
        ref={navRef}
        className={`apple-nav ${scrolled ? "scrolled" : ""}`}
      >
        <div className="nav-inner">
          {/* ── Brand ── */}
          <Link href="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
            <span className="brand-icon">
              <i className="bi bi-gem" />
            </span>
            <span className="brand-text">
              <span className="brand-name">DiamondMS</span>
              <span className="brand-sub">Management System</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="nav-center">
            {navItems.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${item.active ? "active" : ""}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div
                  key={item.id}
                  className="nav-dd-wrap"
                  onMouseEnter={() => openDropdown(item.id)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    className={`nav-item ${item.active ? "active" : ""}`}
                    onClick={() => toggleDropdown(item.id)}
                    aria-expanded={activeDropdown === item.id}
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                    <i className={`bi bi-chevron-down dd-chev ${activeDropdown === item.id ? "open" : ""}`} />
                  </button>

                  <div
                    className={`nav-dropdown ${activeDropdown === item.id ? "show" : ""}`}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="dd-inner">
                      {item.sections.map((sec, si) => (
                        <div key={si}>
                          {si > 0 && <div className="dd-sep" />}
                          {sec.title && <div className="dd-label">{sec.title}</div>}
                          {sec.items.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`dd-item ${pathname === sub.href ? "current" : ""}`}
                              onClick={() => setActiveDropdown(null)}
                            >
                              <span className="dd-icon" style={{ color: sub.color }}>
                                <i className={`bi ${sub.icon}`} />
                              </span>
                              <span className="dd-text">{sub.label}</span>
                              {pathname === sub.href && (
                                <span className="dd-dot" />
                              )}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* ── Right ── */}
          <div className="nav-right">
            {!user ? (
              <div className="auth-btns">
                <Link href="/auth/login" className="btn-ghost">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-solid">
                  Get Started
                </Link>
              </div>
            ) : (
              <div
                className="nav-dd-wrap"
                onMouseEnter={() => openDropdown("user")}
                onMouseLeave={scheduleClose}
              >
                <button
                  className="user-btn"
                  onClick={() => toggleDropdown("user")}
                  aria-expanded={activeDropdown === "user"}
                >
                  <span className="user-av">{initials}</span>
                  <span className="user-info">
                    <span className="user-name">{user.name?.split(" ")[0]}</span>
                    {pro && <span className="user-badge">PRO</span>}
                  </span>
                  <i className={`bi bi-chevron-down dd-chev ${activeDropdown === "user" ? "open" : ""}`} />
                </button>

                <div
                  className={`nav-dropdown user-dd ${activeDropdown === "user" ? "show" : ""}`}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <div className="dd-inner">
                    <div className="dd-user-head">
                      <span className="user-av lg">{initials}</span>
                      <div>
                        <div className="dd-user-name">{user.name}</div>
                        <div className="dd-user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dd-sep" />
                    <button className="dd-item danger" onClick={handleLogout}>
                      <span className="dd-icon" style={{ color: "#ff3b30" }}>
                        <i className="bi bi-box-arrow-right" />
                      </span>
                      <span className="dd-text">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile burger */}
            <button
              className={`burger ${mobileOpen ? "open" : ""}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── Mobile Sheet ── */}
        <div className={`mobile-sheet ${mobileOpen ? "show" : ""}`}>
          <div className="mobile-inner">
            {navItems.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`m-link ${item.active ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                  {item.active && <span className="m-active-dot" />}
                </Link>
              ) : (
                <div key={item.id} className="m-section">
                  <button
                    className={`m-link m-expand ${item.active ? "active" : ""}`}
                    onClick={() => toggleDropdown(item.id === activeDropdown ? null : item.id)}
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                    <i className={`bi bi-chevron-down dd-chev ${activeDropdown === item.id ? "open" : ""}`} />
                  </button>
                  <div className={`m-sub ${activeDropdown === item.id ? "show" : ""}`}>
                    {item.sections.map((sec, si) => (
                      <div key={si}>
                        {sec.title && <div className="m-sub-label">{sec.title}</div>}
                        {sec.items.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`m-sub-link ${pathname === sub.href ? "current" : ""}`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span style={{ color: sub.color }}><i className={`bi ${sub.icon}`} /></span>
                            <span>{sub.label}</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {!user ? (
              <div className="m-auth">
                <Link href="/auth/login" className="m-auth-btn ghost" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/auth/register" className="m-auth-btn solid" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            ) : (
              <div className="m-user-section">
                <div className="m-user-card">
                  <span className="user-av">{initials}</span>
                  <div>
                    <div className="m-user-name">{user.name}</div>
                    <div className="m-user-email">{user.email}</div>
                  </div>
                  {pro && <span className="user-badge">PRO</span>}
                </div>
                <button className="m-signout" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <style dangerouslySetInnerHTML={{ __html: navStyles }} />
    </>
  );
}

const navStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .apple-nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(251, 251, 253, 0.72);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.09);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .apple-nav.scrolled {
    background: rgba(251, 251, 253, 0.88);
    box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
  }

  .nav-inner {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 24px;
    height: 52px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Brand ── */
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 8px;
  }
  .brand-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1d1d1f, #3a3a3c);
    color: #fff;
    font-size: 0.85rem;
    transition: transform 0.3s ease;
  }
  .nav-brand:hover .brand-icon {
    transform: scale(1.06) rotate(-3deg);
  }
  .brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }
  .brand-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1d1d1f;
    letter-spacing: -0.03em;
  }
  .brand-sub {
    font-size: 0.58rem;
    font-weight: 500;
    color: #86868b;
    letter-spacing: 0.01em;
    margin-top: 1px;
  }

  /* ── Center Nav ── */
  .nav-center {
    display: flex;
    align-items: center;
    gap: 2px;
    margin: 0 auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #3a3a3c;
    text-decoration: none;
    border-radius: 8px;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    position: relative;
  }
  .nav-item i:first-child {
    font-size: 0.82rem;
    opacity: 0.7;
  }
  .nav-item:hover {
    color: #1d1d1f;
    background: rgba(0, 0, 0, 0.04);
  }
  .nav-item.active {
    color: #1d1d1f;
    font-weight: 600;
  }
  .nav-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 2px;
    border-radius: 1px;
    background: #1d1d1f;
  }

  .dd-chev {
    font-size: 0.55rem !important;
    opacity: 0.45 !important;
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    margin-left: 0;
  }
  .dd-chev.open {
    transform: rotate(180deg);
  }

  /* ── Dropdown ── */
  .nav-dd-wrap {
    position: relative;
  }
  .nav-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 1001;
  }
  .nav-dropdown.show {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
  }
  .nav-dropdown.user-dd {
    left: auto;
    right: 0;
    transform: translateX(0) translateY(6px);
  }
  .nav-dropdown.user-dd.show {
    transform: translateX(0) translateY(0);
  }

  .dd-inner {
    background: #fff;
    border-radius: 14px;
    box-shadow:
      0 0 0 0.5px rgba(0,0,0,0.05),
      0 4px 12px rgba(0,0,0,0.06),
      0 16px 40px rgba(0,0,0,0.08);
    padding: 6px;
    min-width: 220px;
    backdrop-filter: blur(20px);
  }

  .dd-sep {
    height: 0.5px;
    background: rgba(0,0,0,0.08);
    margin: 4px 10px;
  }
  .dd-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: #86868b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 12px 4px;
  }

  .dd-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 9px;
    text-decoration: none;
    color: #1d1d1f;
    font-size: 0.8rem;
    font-weight: 500;
    transition: background 0.15s ease;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    position: relative;
  }
  .dd-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #1d1d1f;
  }
  .dd-item.current {
    background: rgba(0, 113, 227, 0.06);
  }
  .dd-item.danger:hover {
    background: rgba(255, 59, 48, 0.06);
  }

  .dd-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    background: rgba(0,0,0,0.03);
    flex-shrink: 0;
  }
  .dd-text {
    flex: 1;
    text-align: left;
  }
  .dd-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #0071e3;
    flex-shrink: 0;
  }

  /* ── User dropdown ── */
  .dd-user-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px 8px;
  }
  .dd-user-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: #1d1d1f;
  }
  .dd-user-email {
    font-size: 0.68rem;
    color: #86868b;
    margin-top: 1px;
  }

  /* ── Right section ── */
  .nav-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .auth-btns {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-ghost {
    padding: 7px 16px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #1d1d1f;
    text-decoration: none;
    border-radius: 980px;
    transition: all 0.2s ease;
  }
  .btn-ghost:hover {
    background: rgba(0,0,0,0.04);
    color: #1d1d1f;
  }
  .btn-solid {
    padding: 7px 18px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
    text-decoration: none;
    border-radius: 980px;
    background: #1d1d1f;
    transition: all 0.2s ease;
  }
  .btn-solid:hover {
    background: #3a3a3c;
    color: #fff;
    transform: scale(1.02);
  }

  .user-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 4px;
    border-radius: 980px;
    border: 0.5px solid rgba(0,0,0,0.08);
    background: rgba(0,0,0,0.02);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .user-btn:hover {
    background: rgba(0,0,0,0.05);
    border-color: rgba(0,0,0,0.12);
  }

  .user-av {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }
  .user-av.lg {
    width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .user-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1d1d1f;
  }
  .user-badge {
    font-size: 0.55rem;
    font-weight: 700;
    color: #6366f1;
    background: rgba(99,102,241,0.1);
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  /* ── Burger ── */
  .burger {
    display: none;
    flex-direction: column;
    gap: 5px;
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
    z-index: 1002;
  }
  .burger span {
    display: block;
    width: 18px;
    height: 1.5px;
    background: #1d1d1f;
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform-origin: center;
  }
  .burger.open span:nth-child(1) {
    transform: translateY(6.5px) rotate(45deg);
  }
  .burger.open span:nth-child(2) {
    opacity: 0;
    transform: scaleX(0);
  }
  .burger.open span:nth-child(3) {
    transform: translateY(-6.5px) rotate(-45deg);
  }

  /* ── Mobile sheet ── */
  .mobile-sheet {
    display: none;
    position: fixed;
    top: 52px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    transform: translateY(-100%);
    opacity: 0;
    transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
  }
  .mobile-sheet.show {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  .mobile-inner {
    background: rgba(251, 251, 253, 0.96);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 0.5px solid rgba(0,0,0,0.08);
    padding: 16px 20px 32px;
    max-height: calc(100vh - 52px);
    overflow-y: auto;
  }
  .mobile-overlay {
    position: fixed;
    top: 52px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.15);
    z-index: 998;
    animation: fadeIn 0.25s ease;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

  .m-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    font-size: 0.88rem;
    font-weight: 500;
    color: #3a3a3c;
    text-decoration: none;
    border-radius: 12px;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    transition: background 0.15s ease;
    position: relative;
  }
  .m-link:hover, .m-link.active {
    background: rgba(0,0,0,0.04);
    color: #1d1d1f;
  }
  .m-link.active {
    font-weight: 600;
    color: #1d1d1f;
  }
  .m-link i:first-child { opacity: 0.7; font-size: 0.92rem; }
  .m-link .dd-chev {
    margin-left: auto;
    font-size: 0.6rem !important;
  }
  .m-active-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #0071e3;
    margin-left: auto;
  }

  .m-section { margin-bottom: 2px; }
  .m-sub {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .m-sub.show { max-height: 500px; }
  .m-sub-label {
    font-size: 0.62rem;
    font-weight: 600;
    color: #86868b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 10px 14px 4px 46px;
  }
  .m-sub-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px 9px 46px;
    font-size: 0.82rem;
    font-weight: 500;
    color: #3a3a3c;
    text-decoration: none;
    border-radius: 10px;
    transition: background 0.15s ease;
  }
  .m-sub-link:hover {
    background: rgba(0,0,0,0.03);
    color: #1d1d1f;
  }
  .m-sub-link.current {
    color: #0071e3;
    font-weight: 600;
  }
  .m-sub-link span:first-child { font-size: 0.82rem; }

  .m-auth {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 0.5px solid rgba(0,0,0,0.08);
  }
  .m-auth-btn {
    display: block;
    text-align: center;
    padding: 12px;
    border-radius: 12px;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  .m-auth-btn.ghost {
    color: #1d1d1f;
    background: rgba(0,0,0,0.04);
  }
  .m-auth-btn.solid {
    color: #fff;
    background: #1d1d1f;
  }

  .m-user-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 0.5px solid rgba(0,0,0,0.08);
  }
  .m-user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0 16px;
  }
  .m-user-name { font-size: 0.88rem; font-weight: 600; color: #1d1d1f; }
  .m-user-email { font-size: 0.72rem; color: #86868b; }
  .m-signout {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px 14px;
    border: none;
    background: rgba(255,59,48,0.06);
    color: #ff3b30;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .m-signout:hover { background: rgba(255,59,48,0.1); }

  /* ── Responsive ── */
  @media (max-width: 1023px) {
    .nav-center { display: none; }
    .auth-btns { display: none; }
    .nav-right .nav-dd-wrap { display: none; }
    .burger { display: flex; }
    .mobile-sheet { display: block; }
  }
  @media (min-width: 1024px) {
    .burger { display: none !important; }
    .mobile-sheet { display: none !important; }
    .mobile-overlay { display: none !important; }
  }

  @media (max-width: 1200px) and (min-width: 1024px) {
    .nav-item { padding: 7px 10px; font-size: 0.76rem; }
    .nav-item i:first-child { font-size: 0.78rem; }
    .brand-text { display: none; }
  }
`;