import type { ParsedNotes } from '../types';
import OutputCard from './OutputCard';
import CopyButton from './CopyButton';
import ErrorBanner from './ErrorBanner';
import './OutputSection.css';

interface OutputSectionProps {
  notes: ParsedNotes;
  partialError: string;
  copyButtonLabel: string;
  clipboardFallback: boolean;
  onCopy: () => void;
}

const CARDS: Array<{ key: keyof ParsedNotes; title: string }> = [
  { key: 'simpleExplanation', title: 'Simple Explanation' },
  { key: 'keyPoints', title: 'Key Points' },
  { key: 'importantDefinitions', title: 'Important Definitions' },
  { key: 'quizYourself', title: 'Quiz Yourself' },
  { key: 'quickRevisionSummary', title: 'Quick Revision Summary' },
];

function OutputSection({ notes, partialError, copyButtonLabel, clipboardFallback, onCopy }: OutputSectionProps) {
  return (
    <section className="output-section">
      <div className="output-section__toolbar">
        <h2 className="output-section__heading">Your Study Notes</h2>
        <CopyButton label={copyButtonLabel} onClick={onCopy} />
      </div>

      {clipboardFallback && (
        <ErrorBanner message="Clipboard not available. Please manually select and copy the text below." />
      )}

      {partialError && (
        <ErrorBanner message={partialError} />
      )}

      <div className="output-section__cards">
        {CARDS.map(({ key, title }, index) => (
          notes[key] ? (
            <OutputCard
              key={key}
              title={title}
              content={notes[key]}
              animationDelay={index * 100}
            />
          ) : null
        ))}
      </div>
    </section>
  );
}

export default OutputSection;
