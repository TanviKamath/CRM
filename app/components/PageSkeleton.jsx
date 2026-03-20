import Skeleton from "./Skeleton";

export default function PageSkeleton({ breadcrumb = true, card = true }) {
  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            {/* Header Skeleton */}
            <div className="d-flex align-items-center mb-4">
              <Skeleton width="48px" height="48px" style={{ borderRadius: "50%" }} className="me-3" />
              <div>
                <Skeleton width="200px" height="28px" className="mb-2" />
                <Skeleton width="150px" height="16px" />
              </div>
            </div>
            
            {/* Breadcrumb Skeleton */}
            {breadcrumb && (
              <div className="mb-4 d-flex gap-2">
                <Skeleton width="60px" height="14px" />
                <Skeleton width="10px" height="14px" />
                <Skeleton width="80px" height="14px" />
              </div>
            )}
            
            {/* Card Skeleton */}
            {card && (
              <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white py-4 px-4 border-bottom">
                  <div className="d-flex align-items-center">
                    <Skeleton width="40px" height="40px" style={{ borderRadius: 8 }} className="me-3" />
                    <div>
                      <Skeleton width="120px" height="20px" className="mb-2" />
                      <Skeleton width="160px" height="14px" />
                    </div>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="mb-4">
                     <Skeleton width="20%" height="16px" className="mb-2" />
                     <Skeleton width="100%" height="45px" style={{ borderRadius: 10 }} />
                  </div>
                  <div className="mb-4">
                     <Skeleton width="30%" height="16px" className="mb-2" />
                     <Skeleton width="100%" height="45px" style={{ borderRadius: 10 }} />
                  </div>
                  <div className="mb-4">
                     <Skeleton width="25%" height="16px" className="mb-2" />
                     <Skeleton width="100%" height="45px" style={{ borderRadius: 10 }} />
                  </div>
                  <Skeleton width="150px" height="45px" style={{ borderRadius: 10, marginTop: "1rem" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
