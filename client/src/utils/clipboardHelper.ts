import type { ParsedNotes } from '../types';

const CARD_TITLES: Array<{ key: keyof ParsedNotes; title: string }> = [
  { key: 'simpleExplanation', title: 'Simple Explanation' },
  { key: 'keyPoints', title: 'Key Points' },
  { key: 'importantDefinitions', title: 'Important Definitions' },
  { key: 'quizYourself', title: 'Quiz Yourself' },
  { key: 'quickRevisionSummary', title: 'Quick Revision Summary' },
];

/**
 * Formats all five note sections as plain text suitable for clipboard copy.
 * Each section title is followed by a blank line, then its content.
 * Sections are separated from each other by a blank line.
 *
 * @param notes - The parsed notes object with all five sections
 * @returns Formatted plain text string
 */
export function formatNotesForClipboard(notes: ParsedNotes): string {
  return CARD_TITLES.map(({ key, title }) => {
    const content = notes[key] || '';
    return `${title}\n\n${content}`;
  }).join('\n\n');
}
