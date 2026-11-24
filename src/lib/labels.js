// Label codes: 8 characters, lowercase letters and digits, minus the ones that
// are easy to confuse when read off a label (0/o, 1/l/i).
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** The URL printed in the QR code. Scanning it opens /q/<code> in the app. */
export function labelUrl(code) {
  return `${window.location.origin}/q/${code}`;
}
