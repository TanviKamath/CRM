export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-5 fw-bold text-danger">404</h1>
      <p className="lead">The page you are looking for could not be found.</p>

      <a href="/" className="btn btn-primary mt-3">
        Go Home
      </a>
    </div>
  );
}
