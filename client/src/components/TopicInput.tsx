import './TopicInput.css';

interface TopicInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  validationError: string;
}

function TopicInput({ value, onChange, disabled, validationError }: TopicInputProps) {
  return (
    <div className="topic-input">
      <label htmlFor="topic" className="topic-input__label">
        Enter a study topic
      </label>
      <input
        id="topic"
        type="text"
        className={`topic-input__field${validationError ? ' topic-input__field--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Example: Ohm's Law, Photosynthesis, Python Loops"
        maxLength={500}
        autoComplete="off"
      />
      {validationError && (
        <p className="topic-input__error" role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}

export default TopicInput;
