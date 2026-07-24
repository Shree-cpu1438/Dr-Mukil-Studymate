import { useState, useCallback } from 'react';
import type { StudyLevel, ParsedNotes } from '../types';
import { parseNotes } from '../utils/parseNotes';
import { formatNotesForClipboard } from '../utils/clipboardHelper';

type CopyButtonLabel = 'Copy All Notes' | 'Copied!' | 'Copy Failed';

export interface UseNotesGeneratorReturn {
  // State
  topic: string;
  level: StudyLevel;
  isLoading: boolean;
  notes: ParsedNotes | null;
  errorMessage: string;
  validationError: string;
  partialError: string;
  copyButtonLabel: CopyButtonLabel;
  clipboardFallback: boolean;

  // Actions
  setTopic: (value: string) => void;
  setLevel: (value: StudyLevel) => void;
  generateNotes: () => Promise<void>;
  clearForm: () => void;
  copyNotes: () => Promise<void>;
}

export function useNotesGenerator(): UseNotesGeneratorReturn {
  const [topic, setTopicState] = useState<string>('');
  const [level, setLevelState] = useState<StudyLevel>('Beginner');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<ParsedNotes | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [partialError, setPartialError] = useState<string>('');
  const [copyButtonLabel, setCopyButtonLabel] = useState<CopyButtonLabel>('Copy All Notes');
  const [clipboardFallback, setClipboardFallback] = useState<boolean>(false);

  // setTopic: clears validation error when user types a non-empty value
  const setTopic = useCallback((value: string) => {
    setTopicState(value);
    if (value.trim().length > 0) {
      setValidationError('');
    }
  }, []);

  const setLevel = useCallback((value: StudyLevel) => {
    setLevelState(value);
  }, []);

  // generateNotes: validates, clears errors, fetches from backend
  const generateNotes = useCallback(async () => {
    // Validation gate — must run before any state mutation affecting isLoading
    if (!topic.trim()) {
      setValidationError('Please enter a study topic.');
      return;
    }

    // Clear all previous error states before dispatching the request
    setErrorMessage('');
    setPartialError('');
    setValidationError('');
    setClipboardFallback(false);

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), level }),
      });

      const data = await response.json() as { text?: string; errorType?: string; message?: string };

      if (!response.ok) {
        // Server returned an error — keep existing notes unchanged
        setErrorMessage('Unable to generate notes. Please try again.');
        return;
      }

      if (!data.text) {
        setErrorMessage('Unable to generate notes. Please try again.');
        return;
      }

      // Parse the raw AI response into 5 sections
      const { notes: parsedNotes, missingSections } = parseNotes(data.text);

      // Set notes only if we got at least some content
      const completeNotes: ParsedNotes = {
        simpleExplanation: parsedNotes.simpleExplanation ?? '',
        keyPoints: parsedNotes.keyPoints ?? '',
        importantDefinitions: parsedNotes.importantDefinitions ?? '',
        quizYourself: parsedNotes.quizYourself ?? '',
        quickRevisionSummary: parsedNotes.quickRevisionSummary ?? '',
      };

      setNotes(completeNotes);

      if (missingSections.length > 0) {
        setPartialError(`Could not load: ${missingSections.join(', ')}`);
      }
    } catch {
      // Network error or unexpected failure — notes state unchanged
      setErrorMessage('Unable to generate notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, level]);

  // clearForm: resets all state to initial values
  const clearForm = useCallback(() => {
    setTopicState('');
    setLevelState('Beginner');
    setNotes(null);
    setErrorMessage('');
    setValidationError('');
    setPartialError('');
    setClipboardFallback(false);
    setCopyButtonLabel('Copy All Notes');
  }, []);

  // copyNotes: copies all notes to clipboard with 2-second feedback
  const copyNotes = useCallback(async () => {
    if (!notes) return;

    // Check clipboard API availability
    if (!navigator.clipboard) {
      setClipboardFallback(true);
      return;
    }

    const text = formatNotesForClipboard(notes);

    try {
      await navigator.clipboard.writeText(text);
      setCopyButtonLabel('Copied!');
    } catch {
      setCopyButtonLabel('Copy Failed');
    } finally {
      setTimeout(() => {
        setCopyButtonLabel('Copy All Notes');
      }, 2000);
    }
  }, [notes]);

  return {
    topic,
    level,
    isLoading,
    notes,
    errorMessage,
    validationError,
    partialError,
    copyButtonLabel,
    clipboardFallback,
    setTopic,
    setLevel,
    generateNotes,
    clearForm,
    copyNotes,
  };
}
