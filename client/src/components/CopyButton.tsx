import './CopyButton.css';

interface CopyButtonProps {
  label: string;
  onClick: () => void;
}

function CopyButton({ label, onClick }: CopyButtonProps) {
  const modifier =
    label === 'Copied!' ? 'success' :
    label === 'Copy Failed' ? 'error' : '';

  return (
    <button
      type="button"
      className={`copy-button${modifier ? ` copy-button--${modifier}` : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default CopyButton;
