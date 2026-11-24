import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getBox, listItems, createItem, updateItem, deleteItem, updateBox, deleteBox, setItemPhoto, removeItemPhoto,
} from "../lib/api";
import ItemForm from "../components/ItemForm";
import QrCode from "../components/QrCode";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

/**
 * BOX: what's inside, and changing it. This is the main screen. It's what
 * opens when you scan a label.
 * Wireframe: docs/SPEC.md → "2. Box" (empty + with items)
 */
export default function BoxPage() {
  const { boxId } = useParams();
  const navigate = useNavigate();

  const [box, setBox] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingBox, setEditingBox] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [photoError, setPhotoError] = useState(null); // item saved, but its photo didn't upload

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [b, i] = await Promise.all([getBox(boxId), listItems(boxId)]);
      setBox(b);
      setItems(i);
      setAdding(i.length === 0); // empty box → add form open by default
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxId]);

  if (loading) return <Spinner label="Loading box" />;
  if (error) return <ErrorMessage error={error} onRetry={load} />;
  if (!box) {
    return (
      <section className="empty">
        <h1>Box not found</h1>
        <p className="muted">It may have been deleted.</p>
        <Link to="/" className="btn">Back to boxes</Link>
      </section>
    );
  }

  const sortByName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  const replaceItem = (updated) => setItems((prev) => sortByName(prev.map((i) => (i.id === updated.id ? updated : i))));

  async function handleAdd(fields, photo) {
    setPhotoError(null);
    const saved = { ...(await createItem(box.id, fields)), photoUrl: null };
    setItems((prev) => sortByName([...prev, saved]));
    if (!photo?.file) return;
    // The item is already saved. If only the photo fails, say so here instead of
    // in the form, so submitting again doesn't add the item twice.
    try {
      replaceItem(await setItemPhoto(saved, photo.file));
    } catch (e) {
      setPhotoError(`"${saved.name}" was added, but its photo didn't upload: ${e.message} Use Edit to try again.`);
    }
  }

  async function handleUpdate(item, fields, photo) {
    setPhotoError(null);
    let saved = { ...(await updateItem(item.id, fields)), photoUrl: item.photoUrl };
    replaceItem(saved);
    if (photo?.file) saved = await setItemPhoto(saved, photo.file);
    else if (photo?.remove && saved.photo_path) saved = await removeItemPhoto(saved);
    replaceItem(saved);
    setEditingItemId(null);
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError(e);
    }
  }

  async function handleDeleteBox() {
    const msg = `Delete "${box.name}" and its ${items.length} ${items.length === 1 ? "item" : "items"}? Its label can be reused.`;
    if (!window.confirm(msg)) return;
    try {
      await deleteBox(box.id);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e);
    }
  }

  return (
    <>
      {/* ---------- header ---------- */}
      {editingBox ? (
        <BoxEditForm
          box={box}
          onCancel={() => setEditingBox(false)}
          onSave={async (fields) => {
            const saved = await updateBox(box.id, fields);
            setBox((prev) => ({ ...prev, ...saved }));
            setEditingBox(false);
          }}
        />
      ) : (
        <header className="page-header">
          <div>
            <h1>{box.name}</h1>
            {box.location && <p className="muted" style={{ margin: 0 }}>{box.location}</p>}
            {box.description && <p style={{ margin: "0.25rem 0 0" }}>{box.description}</p>}
          </div>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setEditingBox(true)}>Edit</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteBox}>Delete box</button>
          </div>
        </header>
      )}

      {/* ---------- items ---------- */}
      <section aria-labelledby="items-heading" style={{ marginBottom: "2rem" }}>
        <div className="page-header">
          <h2 id="items-heading" style={{ margin: 0 }}>
            Inside <span className="muted">({items.length})</span>
          </h2>
          {!adding && (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>+ Add item</button>
          )}
        </div>

        {adding && (
          <div style={{ marginBottom: "1rem" }}>
            <ItemForm submitLabel="Add item" onSubmit={handleAdd} onCancel={() => setAdding(false)} />
          </div>
        )}

        <ErrorMessage error={photoError} />

        {items.length === 0 ? (
          <p className="muted">Nothing in this box yet.</p>
        ) : (
          <ul className="card-list">
            {items.map((item) =>
              editingItemId === item.id ? (
                <li key={item.id}>
                  <ItemForm
                    initialValues={item}
                    submitLabel="Save"
                    onSubmit={(fields, photo) => handleUpdate(item, fields, photo)}
                    onCancel={() => setEditingItemId(null)}
                  />
                </li>
              ) : (
                <li key={item.id} className="card item-row">
                  <div className="item-main">
                    {item.photoUrl && (
                      // Opens the full-size photo in a new tab
                      <a href={item.photoUrl} target="_blank" rel="noreferrer" aria-label={`Open photo of ${item.name}`}>
                        <img src={item.photoUrl} alt="" className="item-thumb" loading="lazy" />
                      </a>
                    )}
                    <div>
                      <strong>{item.name}</strong> <span className="qty">×{item.quantity}</span>
                      {item.description && (
                        <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                    <button type="button" className="btn" aria-label={`Edit ${item.name}`} onClick={() => setEditingItemId(item.id)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger" aria-label={`Delete ${item.name}`} onClick={() => handleDelete(item)}>
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      {/* ---------- QR label ---------- */}
      {box.labelCode && (
        <section className="card print-only-target" aria-labelledby="label-heading">
          <h2 id="label-heading" className="no-print">QR label</h2>
          <QrCode code={box.labelCode} title={box.name} size={160} />
          <div className="btn-row no-print" style={{ marginTop: "0.75rem" }}>
            <button type="button" className="btn" onClick={() => window.print()}>Print label</button>
          </div>
        </section>
      )}
    </>
  );
}

/** Inline form for the box's name / location / description. */
function BoxEditForm({ box, onSave, onCancel }) {
  const [name, setName] = useState(box.name ?? "");
  const [location, setLocation] = useState(box.location ?? "");
  const [description, setDescription] = useState(box.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setError("Give the box a name.");
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, location, description });
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate style={{ marginBottom: "1.25rem" }}>
      <div className="field">
        <label htmlFor="edit-box-name">Name</label>
        <input id="edit-box-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="edit-box-location">Location</label>
        <input id="edit-box-location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="edit-box-description">Description</label>
        <textarea id="edit-box-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <ErrorMessage error={error} />
      <div className="btn-row">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
