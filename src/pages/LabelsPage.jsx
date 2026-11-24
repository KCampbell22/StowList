import { createLabels, listLabels } from "../lib/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QrCode from "../components/QrCode";
import ErrorMessage from "../components/ErrorMessage";

/**
 * LABELS: print a sheet of blank QR labels to stick on boxes before you've
 * listed what's inside. Scanning one later starts "Set up this box".
 * Wireframe: docs/SPEC.md → "5. Print labels"
 */
export default function LabelsPage() {
    // Each label is { code, boxId, boxName }; boxName is null for a blank label
    const [labels, setLabels] = useState([]);
    const [count, setCount] = useState(12);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      listLabels()
        .then(setLabels)
        .catch((e) => setError(e.message));
    }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try{
      const newCodes = await createLabels(count);
      const newLabels = newCodes.map((code) => ({ code, boxId: null, boxName: null }));
      setLabels((prev) => [...newLabels, ...prev]);
    }
    catch(e){
      setError(e.message);
    }
    finally {
      setBusy(false);
    }
  }

  const blank = labels.filter((l) => !l.boxId);
  const onBoxes = labels.filter((l) => l.boxId);

  return (
    <section>
    <div className="no-print">
      <h1>Print labels</h1>
      <p className="muted">Stick these on boxes now; scan one later to set it up.</p>

      <form onSubmit={handleCreate} className="card label-controls">
        <div className="field">
          <label htmlFor="label-count">How many new labels?</label>
          <input
            id="label-count"
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create labels"}
        </button>
        <button type="button" className="btn" onClick={() => window.print()} disabled={blank.length === 0}>
          Print blank labels
        </button>
      </form>

      <ErrorMessage error={error} />

   
    </div>

    {/* Screen only: labels already on a box. Each opens its box. */}
    {onBoxes.length > 0 && (
      <div className="no-print">
        <h2 className="labels-heading">On boxes</h2>
        <div className="label-sheet">
          {onBoxes.map((l) => (
            <Link key={l.code} to={`/boxes/${l.boxId}`}>
              <QrCode code={l.code} title={l.boxName} />
            </Link>
          ))}
        </div>
      </div>
    )}
    <h2 className="labels-heading no-print">Blank labels</h2>
      {blank.length === 0 && <p className="muted no-print">No blank labels. Create some above.</p>}
       {/* Printed: only the blank labels */}
    <div className="label-sheet">
      {blank.map((l) => (
        <QrCode key={l.code} code={l.code} />
      ))}
    </div>
    
  </section>
  );
}

