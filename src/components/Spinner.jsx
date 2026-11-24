/** Loading indicator that screen readers announce. */
export default function Spinner({ label = "Loading" }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner-circle" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}
