import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import { getLabel, getLabelByExternalValue } from "../lib/api";
import ErrorMessage from "../components/ErrorMessage";

/**
 * IN-APP SCANNER (/scan): point the camera at any QR code.
 *
 *   StowList label (…/q/<code>)   → same as scanning it with the phone camera (/q/<code>);
 *                                   unknown codes there show "Label not found"
 *   8-character code typed in     → /q/<code> too
 *   any other code, already linked → open its box
 *   any other code, new           → "New box" form that links this code to the box
 *
 * Camera access needs a secure page: https, or localhost on the computer itself.
 */
export default function ScanCodePage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const handlingRef = useRef(false);
  const [status, setStatus] = useState("starting"); // starting | scanning | looking-up | error
  const [error, setError] = useState(null);
  const [typed, setTyped] = useState("");

  /** source: "camera" (read by the scanner) or "typed" (the "Or type the code" box) */
  async function handleCode(raw, source = "camera") {
    if (handlingRef.current) return;
    handlingRef.current = true;
    setStatus("looking-up");
    const value = raw.trim();

    try {
      // 1. A StowList label? Its QR holds a link ending in /q/<8-char code>.
      //    Any address works (localhost, Wi-Fi address, real site) — only the code matters.
      const code = stowListCode(value);
      if (code) {
        // Definitely meant as a StowList label: a scanned StowList link, or a code typed
        // into the box that asks for one. Go to /q/<code> even if it isn't found there,
        // so a typo or someone else's label shows "Label not found" instead of "New box".
        const isStowListLink = value.includes("/q/");
        if (isStowListLink || source === "typed") return navigate(`/q/${code}`, { replace: true });
        // A bare 8-character value read by the camera could be another product's
        // barcode, so only treat it as a label if it really is one.
        if (await getLabel(code)) return navigate(`/q/${code}`, { replace: true });
      }

      // 2. Any other code: already linked to a box?
      const label = await getLabelByExternalValue(value);
      if (label?.storage_unit_id) return navigate(`/boxes/${label.storage_unit_id}`, { replace: true });
      if (label) return navigate(`/boxes/new?label=${label.code}`, { replace: true });

      // 3. New code → set up a box for it
      navigate(`/boxes/new?ext=${encodeURIComponent(value)}`, { replace: true });
    } catch (e) {
      setError(e);
      setStatus("error");
      handlingRef.current = false;
    }
  }

  useEffect(() => {
    if (!window.isSecureContext) {
      setError(
        "The camera only works on a secure (https) page. On your phone, open the https:// address that `npm run dev` prints.",
      );
      setStatus("error");
      return;
    }

    const scanner = new QrScanner(videoRef.current, (result) => handleCode(result.data), {
      returnDetailedScanResult: true,
      preferredCamera: "environment", // back camera
      highlightScanRegion: true,
      highlightCodeOutline: true,
    });

    scanner
      .start()
      .then(() => setStatus("scanning"))
      .catch((e) => {
        const msg = String(e?.message || e);
        setError(
          /denied|permission|NotAllowed/i.test(msg)
            ? "Camera access was blocked. Allow the camera for this site in your browser settings, then reload."
            : /camera not found|NotFound/i.test(msg)
              ? "No camera found on this device. Type the code below instead."
              : `Couldn't start the camera: ${msg}`,
        );
        setStatus("error");
      });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTyped(event) {
    event.preventDefault();
    if (typed.trim()) handleCode(typed, "typed");
  }

  return (
    <section>
      <h1>Scan a code</h1>
      <p className="muted">Point your camera at a StowList label or any other QR code.</p>

      <div
        style={{
          position: "relative",
          background: "#000",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          aspectRatio: "1 / 1",
          maxWidth: 480,
          marginBottom: "1rem",
        }}
      >
        <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {status === "looking-up" && (
          <p role="status" style={{ position: "absolute", inset: "auto 0 0 0", margin: 0, padding: "0.75rem", background: "rgb(0 0 0 / 0.7)", color: "#fff", textAlign: "center" }}>
            Found a code. Opening…
          </p>
        )}
        {status === "starting" && (
          <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", margin: 0, color: "#fff" }}>Starting camera…</p>
        )}
      </div>

      <ErrorMessage error={error} />

      <form onSubmit={handleTyped} className="card">
        <div className="field" style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="typed-code">Or type the code</label>
          <span className="hint">The short code printed under a StowList QR label, e.g. ab3k9xqp</span>
          <input id="typed-code" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={status === "looking-up"}>Open</button>
      </form>
    </section>
  );
}

/** "https://anything/q/ab3k9xqp" or just "ab3k9xqp" → "ab3k9xqp"; otherwise null. */
function stowListCode(value) {
  const m = value.match(/^https?:\/\/\S*\/q\/([a-z0-9]{8})\/?$/i) || value.match(/^([a-z0-9]{8})$/i);
  return m ? m[1].toLowerCase() : null;
}
