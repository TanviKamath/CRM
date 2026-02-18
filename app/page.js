// app/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Stats Card Component
function StatsCard({ title, count, icon, color, href, loading }) {
  return (
    <div className="col-xl-3 col-md-6 mb-4">
      <div
        className="card shadow h-100 border-0"
        style={{ borderLeft: `4px solid var(--bs-${color})` }}
      >
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col">
              <div
                className={`text-${color} text-uppercase mb-1`}
                style={{ fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.5px" }}
              >
                {title}
              </div>
              <div className="h4 mb-0 fw-bold text-dark">
                {loading ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  count.toLocaleString()
                )}
              </div>
            </div>
            <div className="col-auto">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
                style={{ width: "48px", height: "48px" }}
              >
                <i className={`bi ${icon} text-${color}`} style={{ fontSize: "1.25rem" }}></i>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Link href={href} className={`btn btn-${color} btn-sm w-100`}>
              View All <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon, color, href }) {
  return (
    <Link href={href} className="text-decoration-none">
      <div
        className="card h-100 border-0 shadow-sm quick-action-card"
        style={{ transition: "all 0.3s ease", cursor: "pointer" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 0.5rem 1rem rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)";
        }}
      >
        <div className="card-body text-center p-4">
          <div
            className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 bg-${color}`}
            style={{ width: "64px", height: "64px" }}
          >
            <i className={`bi ${icon} text-white`} style={{ fontSize: "1.5rem" }}></i>
          </div>
          <h6 className="card-title mb-2 fw-bold">{title}</h6>
          <p className="card-text text-muted small mb-0">{description}</p>
        </div>
      </div>
    </Link>
  );
}

// Activity Item Component
function ActivityItem({ description, time, icon, color }) {
  return (
    <div className="d-flex align-items-start mb-3 pb-3 border-bottom">
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 bg-${color}`}
        style={{ width: "40px", height: "40px" }}
      >
        <i className={`bi ${icon} text-white`} style={{ fontSize: "0.875rem" }}></i>
      </div>
      <div className="flex-grow-1">
        <p className="mb-0 fw-medium">{description}</p>
        <small className="text-muted">{time}</small>
      </div>
    </div>
  );
}

// Inventory Stat Card
function InventoryStatCard({ title, count, color, icon, loading }) {
  return (
    <div className="col-md-4">
      <div className={`p-3 bg-${color} bg-opacity-10 rounded-3 text-center`}>
        <div className="d-flex align-items-center justify-content-center mb-2">
          <i className={`bi ${icon} text-${color} me-2`}></i>
          <h3 className={`text-${color} mb-0`}>
            {loading ? "..." : count}
          </h3>
        </div>
        <p className="text-muted mb-0 small">{title}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({
    diamonds: 0,
    clients: 0,
    brokers: 0,
    sales: 0,
    availableDiamonds: 0,
    onMemo: 0,
    soldThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Get current greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // Get today's date formatted
  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [diamondsRes, clientsRes, brokersRes, salesRes] = await Promise.all([
          fetch("/api/diamonds"),
          fetch("/api/clients"),
          fetch("/api/brokers"),
          fetch("/api/sales"),
        ]);

        const [diamonds, clients, brokers, sales] = await Promise.all([
          diamondsRes.json(),
          clientsRes.json(),
          brokersRes.json(),
          salesRes.json(),
        ]);

        // Process diamonds data
        const diamondsData = Array.isArray(diamonds) ? diamonds : diamonds.data || [];
        const availableDiamonds = diamondsData.filter(d => d.availability === "available").length;
        const onMemo = diamondsData.filter(d => d.availability === "memo").length;

        // Process sales data
        const salesData = Array.isArray(sales) ? sales : sales.data || [];
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const soldThisMonth = salesData.filter(s => {
          const saleDate = new Date(s.created_at);
          return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
        }).length;

        setStats({
          diamonds: diamondsData.length,
          clients: Array.isArray(clients) ? clients.length : clients.total || 0,
          brokers: Array.isArray(brokers) ? brokers.length : brokers.total || 0,
          sales: salesData.length,
          availableDiamonds,
          onMemo,
          soldThisMonth,
        });

        // Get recent sales
        setRecentSales(salesData.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });
  };

  // Prevent hydration mismatch by not rendering time-dependent content until mounted
  if (!mounted) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fc" }}>
      {/* Bootstrap Icons CDN - Add this to your layout.js head if not already included */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
      />

      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h1 className="h3 mb-1 fw-bold text-dark">
                  <i className="bi bi-sun me-2 text-warning"></i>
                  {getGreeting()}!
                </h1>
                <p className="text-muted mb-0">
                  <i className="bi bi-calendar3 me-1"></i>
                  {getTodayDate()}
                </p>
              </div>
              <div className="d-flex gap-2 mt-3 mt-md-0">
                <Link href="/diamonds/create" className="btn btn-primary">
                  <i className="bi bi-gem me-1"></i> New Diamond
                </Link>
                {user?.subscription === "Pro" && (
                  <Link href="/sales/create" className="btn btn-success">
                    <i className="bi bi-cash-stack me-1"></i> New Sale
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row">
          <StatsCard
            title="Total Diamonds"
            count={stats.diamonds}
            icon="bi-gem"
            color="primary"
            href="/diamonds"
            loading={loading}
          />
          <StatsCard
            title="Total Clients"
            count={stats.clients}
            icon="bi-people"
            color="success"
            href="/clients"
            loading={loading}
          />
          <StatsCard
            title="Total Brokers"
            count={stats.brokers}
            icon="bi-person-badge"
            color="warning"
            href="/brokers"
            loading={loading}
          />
          {/* Sales Stats - Only for Pro Users */}
          {user?.subscription === "Pro" && (
            <StatsCard
              title="Total Sales"
              count={stats.sales}
              icon="bi-graph-up-arrow"
              color="info"
              href="/sales"
              loading={loading}
            />
          )}
        </div>

        {/* Main Content Area */}
        <div className="row">
          {/* Left Column - Main Content */}
          <div className="col-lg-8 mb-4">
            {/* Quick Actions */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-lightning-charge text-warning me-2"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6 col-lg-3">
                    <QuickActionCard
                      title="Add Diamond"
                      description="Record new purchase"
                      icon="bi-gem"
                      color="primary"
                      href="/diamonds/create"
                    />
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <QuickActionCard
                      title="Add Client"
                      description="New client KYC"
                      icon="bi-person-plus"
                      color="success"
                      href="/clients/create"
                    />
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <QuickActionCard
                      title="Add Broker"
                      description="Register broker"
                      icon="bi-person-badge"
                      color="warning"
                      href="/brokers/create"
                    />
                  </div>
                  {/* Sale Action - Only for Pro */}
                  {user?.subscription === "Pro" && (
                    <div className="col-md-6 col-lg-3">
                      <QuickActionCard
                        title="Record Sale"
                        description="New transaction"
                        icon="bi-cash-coin"
                        color="info"
                        href="/sales/create"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Overview */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-box-seam text-primary me-2"></i>
                  Inventory Overview
                </h5>
                <Link href="/diamonds" className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-eye me-1"></i> View All
                </Link>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <InventoryStatCard
                    title="Available Diamonds"
                    count={stats.availableDiamonds}
                    color="success"
                    icon="bi-check-circle"
                    loading={loading}
                  />
                  <InventoryStatCard
                    title="On Memo"
                    count={stats.onMemo}
                    color="warning"
                    icon="bi-hourglass-split"
                    loading={loading}
                  />
                  {user?.subscription === "Pro" && (
                    <InventoryStatCard
                      title="Sold This Month"
                      count={stats.soldThisMonth}
                      color="info"
                      icon="bi-bag-check"
                      loading={loading}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="col-lg-4 mb-4">
            {/* Recent Sales - Only for Pro */}
            {user?.subscription === "Pro" && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-clock-history text-secondary me-2"></i>
                    Recent Sales
                  </h5>
                  <Link href="/sales" className="btn btn-sm btn-outline-primary">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : recentSales.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-inbox display-4 d-block mb-2"></i>
                      <p className="mb-0">No recent sales</p>
                    </div>
                  ) : (
                    recentSales.map((sale) => (
                      <ActivityItem
                        key={sale.id}
                        description={`Sale #${sale.id} - ${formatCurrency(sale.sale_amount)}`}
                        time={new Date(sale.created_at).toLocaleDateString()}
                        icon="bi-receipt"
                        color="success"
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-link-45deg text-secondary me-2"></i>
                  Quick Links
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  <Link
                    href="/diamonds"
                    className="list-group-item list-group-item-action d-flex align-items-center py-3"
                  >
                    <i className="bi bi-gem text-primary me-3"></i>
                    <span className="flex-grow-1">All Diamonds</span>
                    <span className="badge bg-primary rounded-pill">{stats.diamonds}</span>
                  </Link>
                  <Link
                    href="/clients"
                    className="list-group-item list-group-item-action d-flex align-items-center py-3"
                  >
                    <i className="bi bi-people text-success me-3"></i>
                    <span className="flex-grow-1">All Clients</span>
                    <span className="badge bg-success rounded-pill">{stats.clients}</span>
                  </Link>
                  <Link
                    href="/brokers"
                    className="list-group-item list-group-item-action d-flex align-items-center py-3"
                  >
                    <i className="bi bi-person-badge text-warning me-3"></i>
                    <span className="flex-grow-1">All Brokers</span>
                    <span className="badge bg-warning rounded-pill">{stats.brokers}</span>
                  </Link>
                  {/* Sales Link - Only for Pro */}
                  {user?.subscription === "Pro" && (
                    <Link
                      href="/sales"
                      className="list-group-item list-group-item-action d-flex align-items-center py-3"
                    >
                      <i className="bi bi-graph-up-arrow text-info me-3"></i>
                      <span className="flex-grow-1">All Sales</span>
                      <span className="badge bg-info rounded-pill">{stats.sales}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="row mt-4">
          <div className="col-12 text-center text-muted">
            <small>
              <i className="bi bi-gem me-1"></i>
              Diamond Management System
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}