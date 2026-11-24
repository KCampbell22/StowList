import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createBox } from "../lib/api";
import ErrorMessage from "../components/ErrorMessage";

/**
 * NEW BOX: name it, optionally say where it is.
 * Wireframe: docs/SPEC.md → "3. New box"
 *
 * Reached two ways:
 *   /boxes/new               → "New box" button. A new QR label is created automatically.
 *   /boxes/new?label=ab3k9xqp → after scanning a blank label. That label gets attached.
 */
export default function NewBoxPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const labelCode = searchParams.get("label"); // null when not coming from a scan
  const externalValue = searchParams.get("ext"); // an outside QR code read by the in-app scanner

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setError("Give the box a name.");

    setSaving(true);
    setError(null);
    try {
      const box = await createBox({ name, location, description }, labelCode, externalValue);
      navigate(`/boxes/${box.id}`, { replace: true });
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  return (
    <section>
      <h1>{labelCode || externalValue ? "Set up this label" : "New box"}</h1>
      {labelCode && (
        <p className="muted">
          This box will use label <code>{labelCode}</code>.
        </p>
      )}
      {externalValue && (
        <p className="muted" style={{ overflowWrap: "anywhere" }}>
          Scanning this code in StowList will open the box: <code>{externalValue}</code>
        </p>
      )}

      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="box-name">Name</label>
          <input
            id="box-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            autoComplete="off"
            placeholder="Camping gear"
          />
        </div>

        <div className="field">
          <label htmlFor="box-location">
            Location <span className="hint">(optional)</span>
          </label>
          <input
            id="box-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Garage, top shelf"
          />
        </div>

        <div className="field">
          <label htmlFor="box-description">
            Description <span className="hint">(optional)</span>
          </label>
          <textarea id="box-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <ErrorMessage error={error} />

        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create box"}
          </button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
