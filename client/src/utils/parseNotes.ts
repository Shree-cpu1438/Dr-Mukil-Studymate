import type { ParsedNotes, ParseResult } from '../types';

// Section heading patterns to match (case-insensitive)
const SECTION_PATTERNS: Array<{ key: keyof ParsedNotes; patterns: RegExp[] }> = [
  {
    key: 'simpleExplanation',
    patterns: [/simple\s+explanation/i],
  },
  {
    key: 'keyPoints',
    patterns: [/key\s+points/i],
  },
  {
    key: 'importantDefinitions',
    patterns: [/important\s+definitions/i, /definitions/i],
  },
  {
    key: 'quizYourself',
    patterns: [/quiz\s+yourself/i, /quiz\s+questions/i, /three\s+quiz/i],
  },
  {
    key: 'quickRevisionSummary',
    patterns: [/quick\s+revision/i, /revision\s+summary/i, /short\s+revision/i],
  },
];

const SECTION_NAMES: Record<keyof ParsedNotes, string> = {
  simpleExplanation: 'Simple Explanation',
  keyPoints: 'Key Points',
  importantDefinitions: 'Important Definitions',
  quizYourself: 'Quiz Yourself',
  quickRevisionSummary: 'Quick Revision Summary',
};

/**
 * Parses raw AI response text into five structured note sections.
 *
 * @param rawText - The raw text response from Amazon Bedrock
 * @returns ParseResult containing parsed notes and any missing section names
 */
export function parseNotes(rawText: string): ParseResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      notes: {},
      missingSections: Object.values(SECTION_NAMES),
    };
  }

  // Split the text into lines for processing
  const lines = rawText.split('\n');

  // Find where each section starts
  const sectionStarts: Array<{ key: keyof ParsedNotes; lineIndex: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const section of SECTION_PATTERNS) {
      if (section.patterns.some(pattern => pattern.test(line))) {
        // Only add if not already found (take first occurrence)
        if (!sectionStarts.find(s => s.key === section.key)) {
          sectionStarts.push({ key: section.key, lineIndex: i });
        }
        break;
      }
    }
  }

  // Sort by line index to extract content between sections
  sectionStarts.sort((a, b) => a.lineIndex - b.lineIndex);

  const notes: Partial<ParsedNotes> = {};

  for (let i = 0; i < sectionStarts.length; i++) {
    const current = sectionStarts[i];
    const next = sectionStarts[i + 1];

    const startLine = current.lineIndex + 1; // skip the heading line itself
    const endLine = next ? next.lineIndex : lines.length;

    const content = lines
      .slice(startLine, endLine)
      .join('\n')
      .trim();

    notes[current.key] = content;
  }

  // Find which sections are missing
  const missingSections: string[] = [];
  const allKeys: Array<keyof ParsedNotes> = [
    'simpleExplanation',
    'keyPoints',
    'importantDefinitions',
    'quizYourself',
    'quickRevisionSummary',
  ];

  for (const key of allKeys) {
    if (!notes[key] || notes[key]!.trim().length === 0) {
      missingSections.push(SECTION_NAMES[key]);
    }
  }

  return { notes, missingSections };
}
