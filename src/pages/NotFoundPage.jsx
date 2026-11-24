import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="empty">
      <h1>Page not found</h1>
      <p>That link doesn't go anywhere.</p>
      <Link to="/" className="btn btn-primary">Back to your boxes</Link>
    </section>
  );
}
