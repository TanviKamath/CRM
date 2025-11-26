"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">

          <div className="card">
            <div className="card-header">Dashboard</div>

            <div className="card-body">

              {/* Quick Actions */}
              <h5 className="mb-4">Quick Actions</h5>

              <div className="row">

                {/* Add Diamond */}
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <Link href="/diamonds/create" className="btn btn-primary">
                      <i className="fas fa-gem"></i> Add New Diamond
                    </Link>
                  </div>
                </div>

                {/* Add Client */}
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <Link href="/clients/create" className="btn btn-success">
                      <i className="fas fa-user-plus"></i> Add New Client
                    </Link>
                  </div>
                </div>

                {/* Add Broker */}
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <Link href="/brokers/create" className="btn btn-warning">
                      <i className="fas fa-handshake"></i> Add New Broker
                    </Link>
                  </div>
                </div>

                {/* Create Sale */}
                <div className="col-md-6 mb-3">
                  <div className="d-grid">
                    <Link href="/sales/create" className="btn btn-info">
                      <i className="fas fa-dollar-sign"></i> Record New Sale
                    </Link>
                  </div>
                </div>

              </div>

              {/* View All Cards */}
              <div className="row mt-4">

                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Diamonds</h6>
                      <Link href="/api/diamonds/" className="btn btn-sm btn-outline-primary">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Clients</h6>
                      <Link href="/api/clients" className="btn btn-sm btn-outline-success">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Brokers</h6>
                      <Link href="/api/brokers" className="btn btn-sm btn-outline-warning">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Sales</h6>
                      <Link href="/api/sales" className="btn btn-sm btn-outline-info">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
