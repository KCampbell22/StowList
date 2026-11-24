import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { getLabel } from "../lib/api";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

/**
 * SCAN: where every QR code points (/q/<code>). Decides what happens next.
 * Wireframe: docs/SPEC.md → "4. Scanned a label"
 *
 *   label not found      → "This label isn't in your account" (typo, or someone else's)
 *   label has a box      → go straight to that box
 *   label is blank       → "New label!" → button to /boxes/new?label=<code>
 */
export default function ScanPage() {
  const code = useParams().code.toLowerCase();

  const [label, setLabel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setLabel(await getLabel(code));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (loading) return <Spinner label="Looking up label" />;
  if (error) return <ErrorMessage error={error} onRetry={load} />;

  if (!label) {
    return (
      <section className="empty">
        <h1>Label not found</h1>
        <p className="muted">
          Label <code>{code}</code> isn't in your account. Check the code, or it may belong to someone else.
        </p>
        <Link to="/" className="btn">Back to boxes</Link>
      </section>
    );
  }

  if (label.storage_unit_id) return <Navigate to={`/boxes/${label.storage_unit_id}`} replace />;

  return (
    <section className="empty">
      <h1>New label</h1>
      <p className="qr-code-text" style={{ fontSize: "1.25rem" }}>{code}</p>
      <p className="muted">This label isn't on a box yet. Set one up and this code will open it from now on.</p>
      <div className="btn-row">
        <Link to={`/boxes/new?label=${code}`} className="btn btn-primary btn-lg">Set up this box</Link>
      </div>
    </section>
  );
}
