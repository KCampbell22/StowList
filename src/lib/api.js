/**
 * Every database call the app needs, in one place. Pages import these instead
 * of talking to Supabase directly. Each function throws on error, so wrap
 * calls in try/catch and show the message to the user.
 *
 * In the UI a storage unit is called a "box", but it can be anything: a bin,
 * a shelf, a drawer.
 */

import { supabase } from "./supabase";
import { generateCode } from "./labels";
import { resizeImage } from "./images";

const PHOTO_BUCKET = "item-photos";
const PHOTO_URL_SECONDS = 60 * 60; // signed photo links last an hour; reloading the page makes fresh ones

/** Supabase returns { data, error }; this turns errors into exceptions. */
function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// ---------- boxes (storage units) ----------

/** All boxes, A–Z, each with itemCount and labelCode. */
export async function listBoxes() {
  const rows = unwrap(
    await supabase
      .from("storage_units")
      .select("id, name, location, description, updated_at, items(count), labels(code)")
      .order("name"),
  );
  return rows.map(({ items, labels, ...box }) => ({
    ...box,
    itemCount: items[0]?.count ?? 0,
    labelCode: labels?.code ?? labels?.[0]?.code ?? null,
  }));
}

/** One box with its labelCode, or null if it doesn't exist (or isn't yours). */
export async function getBox(id) {
  const row = unwrap(
    await supabase.from("storage_units").select("*, labels(code)").eq("id", id).maybeSingle(),
  );
  if (!row) return null;
  const { labels, ...box } = row;
  return { ...box, labelCode: labels?.code ?? labels?.[0]?.code ?? null };
}

/**
 * Creates a box and links a QR label to it.
 * @param {{ name: string, location?: string, description?: string }} fields
 * @param {string} [labelCode] An existing blank label (from a scan). If omitted, a new label is made.
 */
export async function createBox(fields, labelCode, externalValue) {
  const box = unwrap(await supabase.from("storage_units").insert(clean(fields)).select().single());
  if (labelCode) await assignLabel(labelCode, box.id);
  else labelCode = (await createLabels(1, box.id, externalValue))[0];
  return { ...box, labelCode };
}

export async function updateBox(id, fields) {
  return unwrap(await supabase.from("storage_units").update(clean(fields)).eq("id", id).select().single());
}

/** Deletes the box, its items and their photos. Its label becomes blank and can be reused. */
export async function deleteBox(id) {
  // The database deletes the items for us, but not their photo files, so note them first
  const withPhotos = unwrap(
    await supabase.from("items").select("photo_path").eq("storage_unit_id", id).not("photo_path", "is", null),
  );
  unwrap(await supabase.from("storage_units").delete().eq("id", id));
  await removePhotoFiles(withPhotos.map((r) => r.photo_path));
}

// ---------- items ----------

/** A box's items A–Z, each with photoUrl (a temporary link, or null). */
export async function listItems(boxId) {
  return withPhotoUrls(
    unwrap(await supabase.from("items").select("*").eq("storage_unit_id", boxId).order("name")),
  );
}

/** @param {{ name: string, description?: string, quantity?: number }} fields */
export async function createItem(boxId, fields) {
  return unwrap(
    await supabase.from("items").insert({ ...clean(fields), storage_unit_id: boxId }).select().single(),
  );
}

export async function updateItem(id, fields) {
  return unwrap(await supabase.from("items").update(clean(fields)).eq("id", id).select().single());
}

/** Deletes the item and its photo. */
export async function deleteItem(id) {
  const deleted = unwrap(await supabase.from("items").delete().eq("id", id).select("photo_path"));
  await removePhotoFiles(deleted.map((r) => r.photo_path));
}

// ---------- item photos (Supabase Storage) ----------

/**
 * Shrinks `file`, uploads it and makes it the item's photo, replacing any old one.
 * Returns the updated item with photoUrl.
 */
export async function setItemPhoto(item, file) {
  const blob = await resizeImage(file);
  // A new file name each time, so browsers and the CDN never show a cached old photo
  const path = `${await currentUserId()}/${item.id}-${Date.now()}.jpg`;
  unwrap(await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" }));

  let saved;
  try {
    saved = unwrap(await supabase.from("items").update({ photo_path: path }).eq("id", item.id).select().single());
  } catch (e) {
    await removePhotoFiles([path]); // don't leave an unused file behind
    throw e;
  }
  if (item.photo_path) await removePhotoFiles([item.photo_path]);
  return (await withPhotoUrls([saved]))[0];
}

/** Removes the item's photo. Returns the updated item (photoUrl: null). */
export async function removeItemPhoto(item) {
  const saved = unwrap(await supabase.from("items").update({ photo_path: null }).eq("id", item.id).select().single());
  await removePhotoFiles([item.photo_path]);
  return { ...saved, photoUrl: null };
}

/** Adds photoUrl to each item: a signed link that works for an hour, or null. One request for the lot. */
async function withPhotoUrls(items) {
  const paths = items.map((i) => i.photo_path).filter(Boolean);
  if (paths.length === 0) return items.map((i) => ({ ...i, photoUrl: null }));

  const signed = unwrap(await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_SECONDS));
  const urlByPath = new Map(signed.filter((s) => !s.error).map((s) => [s.path, s.signedUrl]));
  return items.map((i) => ({ ...i, photoUrl: urlByPath.get(i.photo_path) ?? null }));
}

/**
 * Deletes photo files. A failure here is only logged: the item change has already
 * been saved, and a leftover file is harmless.
 */
async function removePhotoFiles(paths) {
  const real = paths.filter(Boolean);
  if (real.length === 0) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(real);
  if (error) console.warn("Couldn't delete photo files", real, error);
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error("You've been signed out. Sign in again and retry.");
  return id;
}

/** Items whose name or description contains `query`, each with its box. */
export async function searchItems(query) {
  // Strip characters that have special meaning in Supabase filters
  const q = query.replace(/[%_,()*\\]/g, " ").trim();
  if (!q) return [];
  return unwrap(
    await supabase
      .from("items")
      .select("*, box:storage_units(id, name, location)")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .order("name")
      .limit(50),
  );
}

// ---------- QR labels ----------

/** { code, storage_unit_id } or null if the code doesn't exist (or isn't yours). */
export async function getLabel(code) {
  return unwrap(await supabase.from("labels").select("code, storage_unit_id").eq("code", code).maybeSingle());
}

/** A label made from an outside QR code / barcode (exact scanned text), or null. */
export async function getLabelByExternalValue(value) {
  return unwrap(
    await supabase.from("labels").select("code, storage_unit_id").eq("external_value", value).maybeSingle(),
  );
}

/**
 * Creates `count` new label codes (blank unless boxId is given). Returns the codes.
 * externalValue: the scanned text of an outside QR code this label stands for (count must be 1).
 */
export async function createLabels(count, boxId = null, externalValue = null) {
  const rows = Array.from({ length: count }, () => ({
    code: generateCode(),
    storage_unit_id: boxId,
    ...(externalValue ? { external_value: externalValue } : {}),
  }));
  return unwrap(await supabase.from("labels").insert(rows).select("code")).map((r) => r.code);
}

/** Blank labels, newest first, for reprinting. */
export async function listBlankLabels() {
  return unwrap(
    await supabase.from("labels").select("code, created_at").is("storage_unit_id", null).order("created_at", { ascending: false }),
  );
}

/**
 * All of the signed-in user's labels (row-level security limits it to theirs),
 * blank ones first, then newest first. Each is { code, boxId, boxName }, where
 * boxId and boxName are null for a blank label.
 */
export async function listLabels() {
  const rows = unwrap(
    await supabase
      .from("labels")
      .select("code, created_at, storage_unit_id, storage_units(name)")
      .order("storage_unit_id", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false }),
  );
  return rows.map((r) => ({
    code: r.code,
    boxId: r.storage_unit_id,
    boxName: r.storage_units?.name ?? null,
  }));
}

export async function assignLabel(code, boxId) {
  unwrap(await supabase.from("labels").update({ storage_unit_id: boxId }).eq("code", code));
}

// ---------- helpers ----------

/** Trims strings and turns empty optional fields into null. */
function clean(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    out[k] = typeof v === "string" ? v.trim() || null : v;
  }
  return out;
}
