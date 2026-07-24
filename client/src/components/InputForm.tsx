import type { StudyLevel } from '../types';
import TopicInput from './TopicInput';
import LevelSelect from './LevelSelect';
import FormActions from './FormActions';
import './InputForm.css';

interface InputFormProps {
  topic: string;
  level: StudyLevel;
  isLoading: boolean;
  validationError: string;
  onTopicChange: (value: string) => void;
  onLevelChange: (value: StudyLevel) => void;
  onGenerate: () => void;
  onClear: () => void;
}

function InputForm({
  topic,
  level,
  isLoading,
  validationError,
  onTopicChange,
  onLevelChange,
  onGenerate,
  onClear,
}: InputFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <section className="input-form-section">
      <form className="input-form" onSubmit={handleSubmit} noValidate>
        <TopicInput
          value={topic}
          onChange={onTopicChange}
          disabled={isLoading}
          validationError={validationError}
        />
        <LevelSelect
          value={level}
          onChange={onLevelChange}
          disabled={isLoading}
        />
        <FormActions
          onGenerate={onGenerate}
          onClear={onClear}
          isLoading={isLoading}
          generateDisabled={!topic.trim()}
        />
      </form>
    </section>
  );
}

export default InputForm;
