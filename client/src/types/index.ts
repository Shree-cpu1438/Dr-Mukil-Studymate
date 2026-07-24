/** The three supported study levels. */
export type StudyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/**
 * The five structured sections parsed from the Bedrock response.
 * Each field maps directly to one Output_Card displayed in the UI.
 */
export interface ParsedNotes {
  simpleExplanation: string;      // Card 1 — Simple Explanation
  keyPoints: string;              // Card 2 — Key Points
  importantDefinitions: string;   // Card 3 — Important Definitions
  quizYourself: string;           // Card 4 — Quiz Yourself
  quickRevisionSummary: string;   // Card 5 — Quick Revision Summary
}

/**
 * Structured error returned by bedrockService and forwarded to the client.
 */
export interface BedrockError {
  errorType: 'TIMEOUT' | 'BEDROCK_ERROR' | 'UNKNOWN';
  message: string;
}

/**
 * Result of parseNotes() — the parsed sections plus any that could not be parsed.
 */
export interface ParseResult {
  notes: Partial<ParsedNotes>;
  missingSections: string[];
}
