import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBoxes, searchItems } from "../lib/api";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

/**
 * HOME: all boxes + search across every item.
 * Wireframe: docs/SPEC.md → "1. Home"
 *
 * Already done (copy this pattern on other pages): loading boxes with
 * loading + error states.
 */
export default function HomePage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setBoxes(await listBoxes());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  // Search ~300 ms after typing stops
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await searchItems(query);
        if (!cancelled) {
          setResults(r);
          setSearchError(null);
        }
      } catch (e) {
        if (!cancelled) setSearchError(e);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  if (loading) return <Spinner label="Loading your boxes" />;

  const plural = (n) => `${n} ${n === 1 ? "item" : "items"}`;

  return (
    <>
      <header className="page-header">
        <h1 style={{ margin: 0 }}>Your boxes</h1>
        <Link to="/boxes/new" className="btn btn-primary">+ New box</Link>
      </header>

      <ErrorMessage error={error} onRetry={load} />

      {boxes.length > 0 && (
        <div className="field">
          <label htmlFor="search">Find an item</label>
          <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tent, HDMI cable…" />
        </div>
      )}

      {query.trim() ? (
        <section aria-live="polite">
          <ErrorMessage error={searchError} />
          {results.length === 0 ? (
            <p className="muted">Nothing matches “{query}”.</p>
          ) : (
            <ul className="card-list">
              {results.map((item) => (
                <li key={item.id}>
                  <Link to={`/boxes/${item.box?.id}`} className="card">
                    <strong>{item.name}</strong> <span className="qty">×{item.quantity}</span>
                    <div className="muted">
                      in {item.box?.name}
                      {item.box?.location && ` · ${item.box.location}`}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : boxes.length === 0 && !error ? (
        <section className="empty card">
          <h2>No boxes yet</h2>
          <p className="muted">Create a box, then stick its QR label on. Scan it any time to see what's inside.</p>
          <div className="btn-row">
            <Link to="/boxes/new" className="btn btn-primary">New box</Link>
            <Link to="/labels" className="btn">Print blank labels</Link>
          </div>
        </section>
      ) : (
        <ul className="card-list">
          {boxes.map((box) => (
            <li key={box.id}>
              <Link to={`/boxes/${box.id}`} className="card">
                <strong>{box.name}</strong>
                <div className="muted">
                  {box.location && `${box.location} · `}
                  {plural(box.itemCount)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
