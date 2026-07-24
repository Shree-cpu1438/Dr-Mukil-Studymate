import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="spinner-wrapper" role="status" aria-label="Generating notes\u2026">
      <div className="spinner" />
      <p className="spinner__text">Generating your study notes\u2026</p>
    </div>
  );
}

export default LoadingSpinner;
