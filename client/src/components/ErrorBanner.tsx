import './ErrorBanner.css';

interface ErrorBannerProps {
  message: string;
}

function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon">&#9888;</span>
      <span className="error-banner__message">{message}</span>
    </div>
  );
}

export default ErrorBanner;
