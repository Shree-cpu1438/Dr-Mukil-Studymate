import './FormActions.css';

interface FormActionsProps {
  onGenerate: () => void;
  onClear: () => void;
  isLoading: boolean;
  generateDisabled: boolean;
}

function FormActions({ onGenerate, onClear, isLoading, generateDisabled }: FormActionsProps) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="form-actions__generate"
        onClick={onGenerate}
        disabled={generateDisabled || isLoading}
      >
        {isLoading ? 'Generating\u2026' : 'Generate Notes'}
      </button>
      <button
        type="button"
        className="form-actions__clear"
        onClick={onClear}
        disabled={isLoading}
      >
        Clear
      </button>
    </div>
  );
}

export default FormActions;
