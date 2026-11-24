import { useEffect, useMemo, useRef, useState } from "react";
import ErrorMessage from "./ErrorMessage";

/**
 * Add or edit an item: name, description, quantity, photo.
 * Wireframe: docs/SPEC.md → "2b. Add / edit item"
 *
 *   <ItemForm submitLabel="Add item" onSubmit={async (fields, photo) => {...}} onCancel={...} />
 *   <ItemForm initialValues={item} submitLabel="Save" onSubmit={...} onCancel={...} />
 *
 * onSubmit receives ({ name, description, quantity }, { file, remove }) and may throw.
 *   photo.file   a newly chosen image File, or null
 *   photo.remove true if the user removed the item's existing photo
 * The error is shown and what the user typed is kept.
 */
export default function ItemForm({ initialValues = {}, submitLabel = "Save", onSubmit, onCancel }) {
  const [name, setName] = useState(initialValues.name ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [quantity, setQuantity] = useState(initialValues.quantity ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const nameRef = useRef(null);

  // Photo: a newly picked file (shown from a local preview URL) or the item's saved photo
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);
  const shownPhoto = previewUrl ?? (removePhoto ? null : initialValues.photoUrl ?? null);

  const isEditing = Boolean(initialValues.id);
  const idPrefix = isEditing ? `item-${initialValues.id}` : "new-item";

  function handlePhotoChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again after removing it
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That file isn't an image.");
    setError(null);
    setPhotoFile(file);
    setRemovePhoto(false);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setRemovePhoto(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!name.trim()) return setError("Give the item a name.");
    if (!Number.isInteger(qty) || qty < 0) return setError("Quantity must be a whole number, 0 or more.");

    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, description, quantity: qty }, { file: photoFile, remove: removePhoto && !photoFile });
      if (!isEditing) {
        // Ready for the next item straight away
        setName("");
        setDescription("");
        setQuantity(1);
        setPhotoFile(null);
        setRemovePhoto(false);
        nameRef.current?.focus();
      }
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  const step = (delta) => setQuantity((q) => Math.max(0, (Number(q) || 0) + delta));

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>Name</label>
        <input
          id={`${idPrefix}-name`}
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          autoComplete="off"
          placeholder="Extension cord"
        />
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-qty`}>Quantity</label>
        <div className="btn-row" style={{ alignItems: "center" }}>
          <button type="button" className="btn" aria-label="Decrease quantity" onClick={() => step(-1)}>−</button>
          <input
            id={`${idPrefix}-qty`}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button type="button" className="btn" aria-label="Increase quantity" onClick={() => step(1)}>+</button>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-desc`}>
          Description <span className="hint">(optional)</span>
        </label>
        <textarea id={`${idPrefix}-desc`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="field">
        <span className="field-label" id={`${idPrefix}-photo-label`}>
          Photo <span className="hint">(optional)</span>
        </span>
        {shownPhoto && <img src={shownPhoto} alt={name ? `Photo of ${name}` : "Item photo"} className="photo-preview" />}
        {/* On phones this offers the camera or the photo library */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          aria-labelledby={`${idPrefix}-photo-label`}
          onChange={handlePhotoChosen}
        />
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
            {shownPhoto ? "Change photo" : "Add photo"}
          </button>
          {shownPhoto && (
            <button type="button" className="btn btn-danger" onClick={handleRemovePhoto}>Remove photo</button>
          )}
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="btn-row">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (photoFile ? "Uploading photo…" : "Saving…") : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
