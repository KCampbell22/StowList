/** Error box that screen readers announce. Renders nothing when there's no error. */
export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <p>{typeof error === "string" ? error : error.message || "Something went wrong."}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}
