import { QRCodeSVG } from "qrcode.react";
import { labelUrl } from "../lib/labels";

/**
 * A QR code for a label, with the short code printed underneath so you can
 * type it in if the code ever won't scan.
 *
 *   <QrCode code="ab3k9xqp" />                      on screen
 *   <QrCode code="ab3k9xqp" title="Garage – Tools" /> on a printed label
 */
export default function QrCode({ code, title, size = 128 }) {
  return (
    <figure className="qr">
      <QRCodeSVG value={labelUrl(code)} size={size} level="M" marginSize={1} title={`QR code for label ${code}`} />
      <figcaption>
        {title && <strong>{title}</strong>}
        <span className="qr-code-text">{code}</span>
      </figcaption>
    </figure>
  );
}
