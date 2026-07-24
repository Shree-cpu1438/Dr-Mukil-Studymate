import type { StudyLevel } from '../types';
import './LevelSelect.css';

interface LevelSelectProps {
  value: StudyLevel;
  onChange: (value: StudyLevel) => void;
  disabled: boolean;
}

const LEVELS: StudyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

function LevelSelect({ value, onChange, disabled }: LevelSelectProps) {
  return (
    <div className="level-select">
      <label htmlFor="level" className="level-select__label">
        Study Level
      </label>
      <select
        id="level"
        className="level-select__field"
        value={value}
        onChange={(e) => onChange(e.target.value as StudyLevel)}
        disabled={disabled}
      >
        {LEVELS.map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LevelSelect;
