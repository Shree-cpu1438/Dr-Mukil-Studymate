# Design Document

## Overview

StudyMate: AI Topic Notes Generator is a single-page React + TypeScript application built with Vite. The frontend communicates with Amazon Bedrock through a lightweight Express backend that keeps AWS credentials off the client. The design is deliberately simple — every file has one clear responsibility, state is managed with plain React Hooks, and there are no complex state libraries, authentication systems, databases, caching layers, or logging frameworks. The project is sized appropriately for a university demonstration: easy to read, easy to run, and easy to deploy.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User's Browser                      │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │          React SPA  (Vite + TypeScript)         │   │
│   │                                                 │   │
│   │   Header → InputForm → OutputSection → Footer   │   │
│   │                    ↕                            │   │
│   │              useNotesGenerator (Hook)           │   │
│   └──────────────────┬──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                       │  HTTP POST /api/generate
                       ▼
┌─────────────────────────────────────────────────────────┐
│          Express API Server  (Node.js)                  │
│                                                         │
│   routes/generate.ts  →  services/bedrockService.ts     │
│                          (AWS SDK for JavaScript v3)    │
└──────────────────────┬──────────────────────────────────┘
                       │  AWS SDK call
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Amazon Bedrock  (AWS)                      │
│         Foundation model identified by AWS_MODEL_ID     │
└─────────────────────────────────────────────────────────┘
```

**Why a backend server?** AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) must never be bundled in client-side JavaScript. The Express server holds credentials in environment variables and acts as a thin, single-endpoint proxy between the browser and Bedrock. It exposes exactly one route: `POST /api/generate`. There is no authentication, no database, no session handling, and no middleware beyond JSON body parsing and CORS.

### Folder Structure

```
studymate/
├── client/                         # React frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # App title and subtitle
│   │   │   ├── InputForm.tsx        # Form wrapper (topic + level + buttons)
│   │   │   ├── TopicInput.tsx       # Controlled text input + validation message
│   │   │   ├── LevelSelect.tsx      # Study level dropdown
│   │   │   ├── FormActions.tsx      # Generate Notes + Clear buttons
│   │   │   ├── LoadingSpinner.tsx   # Spinner shown during API call
│   │   │   ├── ErrorBanner.tsx      # Error message area
│   │   │   ├── OutputSection.tsx    # Container for cards + Copy button
│   │   │   ├── OutputCard.tsx       # Single note card with entrance animation
│   │   │   └── CopyButton.tsx       # Copy All Notes with feedback states
│   │   ├── hooks/
│   │   │   └── useNotesGenerator.ts # All app state + generation logic
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript types and interfaces
│   │   ├── utils/
│   │   │   ├── parseNotes.ts        # Parses raw Bedrock text into 5 sections
│   │   │   └── clipboardHelper.ts   # Formats notes as plain text for clipboard
│   │   ├── App.tsx                  # Root component — wires hook to components
│   │   ├── main.tsx                 # Vite entry point
│   │   └── index.css                # Global styles, CSS variables, theme tokens
│   ├── index.html
│   ├── tsconfig.json
│   └── vite.config.ts               # Proxies /api → Express in dev
│
├── server/
│   ├── bedrockService.ts            # Thin AWS SDK wrapper (generateNotes function)
│   ├── index.ts                     # Express app: POST /api/generate + static serving
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example                    # Lists all four env vars with no values
├── package.json                    # Root scripts: dev, build, start
└── README.md                       # Full project documentation
```

The server is intentionally flat — two files only. `bedrockService.ts` is the Bedrock_Client (pure AWS SDK wrapper). `index.ts` sets up Express, registers the single `/api/generate` route, and serves the built React app as static files in production.

### Component Hierarchy

```
App
├── Header                        — title + subtitle (Req 1.1, 1.2)
├── InputForm                     — topic input, level dropdown, buttons (Req 2)
│   ├── TopicInput                — controlled text input + inline validation (Req 2.1, 2.4, 6.1)
│   ├── LevelSelect               — Beginner/Intermediate/Advanced dropdown (Req 2.2)
│   └── FormActions               — Generate Notes + Clear buttons (Req 2.3, 8.1)
├── ErrorBanner                   — API/timeout error display area (Req 6.2)
├── LoadingSpinner                — visible while request is in-flight (Req 4)
├── OutputSection                 — wrapper rendered only when cards exist (Req 5)
│   ├── OutputCard ×5             — individual section card with animation (Req 5.1, 5.2)
│   └── CopyButton                — Copy All Notes button with feedback (Req 7)
└── Footer                        — simple branding footer
```

Each component is a small, single-purpose function component. No component manages application state directly — all state lives in the `useNotesGenerator` hook and is passed down as props.

### Data Flow

```
User types topic + selects level
        │
        ▼
  TopicInput / LevelSelect (controlled inputs — state in useNotesGenerator)
        │
        ▼
  User clicks "Generate Notes"
        │
        ▼
  useNotesGenerator.generateNotes()
    1. Validate: topic non-empty & ≤ 500 chars
       → if invalid: set validationError, return early
    2. Clear previous errorMessage, partialError, validationError
    3. Set isLoading = true  → disables form, shows spinner
    4. Call POST /api/generate  { topic, level }
        │
        ▼
  Express route handler (generate.ts)
    5. Receives { topic, level }
    6. Calls bedrockService.generateNotes(topic, level)
        │
        ▼
  bedrockService.ts
    7. Builds AI_Prompt string
    8. Invokes Bedrock model via AWS SDK (60-second AbortSignal timeout)
    9. Returns raw response text OR throws structured BedrockError
        │
        ▼
  Back in useNotesGenerator
   10. On success:
       a. Pass raw text to parseNotes(rawText)
       b. parseNotes returns ParsedNotes (5 sections) + list of any missing sections
       c. Set notes = ParsedNotes
       d. If any sections missing: set partialError listing the missing section names
   11. On error:
       a. Set errorMessage = "Unable to generate notes. Please try again."
       b. notes state unchanged (previous successful notes remain visible)
   12. Set isLoading = false → re-enables form, hides spinner
        │
        ▼
  React re-render
   — OutputSection renders OutputCard ×5 with sequential entrance animation
   — ErrorBanner shows if errorMessage or partialError is set
   — Previous cards remain visible if the new request failed
```

### Bedrock Request Flow

```
bedrockService.ts  (server/bedrockService.ts)
— thin wrapper around the AWS SDK, no other dependencies —

Configuration (read from environment variables at module load):
  AWS_REGION            → BedrockRuntimeClient({ region })
  AWS_MODEL_ID          → used as modelId in every InvokeModelCommand
  AWS_ACCESS_KEY_ID     → credentials.accessKeyId
  AWS_SECRET_ACCESS_KEY → credentials.secretAccessKey

Exported function:
  generateNotes(topic: string, level: StudyLevel): Promise<string>

Steps:
  1. Build prompt:
     "You are an expert tutor. Explain the topic: {topic}.
      Study level: {level}. Generate:
      1. Simple Explanation
      2. Key Points (bullet list)
      3. Important Definitions
      4. Three Quiz Questions with Answers
      5. A Short Revision Summary.
      Use clear headings and simple language."

  2. Create AbortController — setTimeout 60 000 ms → controller.abort()

  3. Send InvokeModelCommand to BedrockRuntimeClient with:
       modelId: process.env.AWS_MODEL_ID
       body: JSON.stringify({ prompt, max_tokens: 2048 })
       signal: abortController.signal

  4. On success  → decode response body → return plain text string

  5. On AbortError → throw { errorType: "TIMEOUT", message: "Request timed out..." }

  6. On any other error → throw { errorType: "BEDROCK_ERROR", message: err.message }
```

### Deployment Architecture

**Local Development**
```
  npm run dev
      ├── Vite dev server  :5173  (client/)
      │     vite.config.ts proxies /api → :3001
      └── ts-node Express  :3001  (server/)  — reads .env
```

**Production**
```
  npm run build
      ├── Vite builds client/ → client/dist/   (static assets)
      └── tsc compiles server/ → server/dist/  (Node.js bundle)

  npm run start
      └── Express serves client/dist/ as static files
          AND handles POST /api/generate
          (single process, single port — easy to deploy anywhere)
```

**Environment Variables (server-side only)**

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AWS_MODEL_ID` | Bedrock model identifier |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret access key |

**Deployment Options**
- **Render / Railway / Fly.io** — connect GitHub repo, set `npm run build` as build command and `npm run start` as start command, add the four env vars, deploy.
- **AWS Amplify (SSR)** — same steps via the Amplify Console.
- **VPS / EC2** — clone repo, create `.env`, run `npm install && npm run build && npm run start`.

---

## Components and Interfaces

### useNotesGenerator Hook

The single hook that owns all application state and the generation workflow.

```typescript
interface UseNotesGeneratorReturn {
  // State
  topic: string;
  level: StudyLevel;
  isLoading: boolean;
  notes: ParsedNotes | null;
  errorMessage: string;
  validationError: string;
  partialError: string;

  // Actions
  setTopic: (value: string) => void;
  setLevel: (value: StudyLevel) => void;
  generateNotes: () => Promise<void>;
  clearForm: () => void;
  copyNotes: () => Promise<void>;
  copyButtonLabel: 'Copy All Notes' | 'Copied!' | 'Copy Failed';
}
```

### Component Props

```typescript
// Header — no props, purely presentational

interface TopicInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  validationError: string;
}

interface LevelSelectProps {
  value: StudyLevel;
  onChange: (v: StudyLevel) => void;
  disabled: boolean;
}

interface FormActionsProps {
  onGenerate: () => void;
  onClear: () => void;
  isLoading: boolean;
  generateDisabled: boolean;  // true when topic empty or loading
}

interface ErrorBannerProps {
  message: string;  // empty string means hidden
}

// LoadingSpinner — no props, shown/hidden via conditional render in App

interface OutputSectionProps {
  notes: ParsedNotes;
  partialError: string;
  copyButtonLabel: string;
  onCopy: () => void;
}

interface OutputCardProps {
  title: string;
  content: string;
  animationDelay: number;  // ms — controls sequential entrance
}

interface CopyButtonProps {
  label: string;  // 'Copy All Notes' | 'Copied!' | 'Copy Failed'
  onClick: () => void;
}
```

### API Contract

**Request**
```
POST /api/generate
Content-Type: application/json

{ "topic": string, "level": "Beginner" | "Intermediate" | "Advanced" }
```

**Success Response**
```
HTTP 200
{ "text": string }   // raw Bedrock response, parsed client-side
```

**Error Response**
```
HTTP 500
{ "errorType": "TIMEOUT" | "BEDROCK_ERROR" | "UNKNOWN", "message": string }
```

---

## Data Models

```typescript
// types/index.ts

/** The three supported study levels. */
export type StudyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/**
 * The five structured sections parsed from the Bedrock response.
 * Each field maps directly to one Output_Card.
 */
export interface ParsedNotes {
  simpleExplanation: string;       // Card 1 — Simple Explanation
  keyPoints: string;               // Card 2 — Key Points
  importantDefinitions: string;    // Card 3 — Important Definitions
  quizYourself: string;            // Card 4 — Quiz Yourself
  quickRevisionSummary: string;    // Card 5 — Quick Revision Summary
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
  missingSections: string[];        // e.g. ['Quiz Yourself'] if that section was absent
}
```

### CSS Design Tokens

```css
/* index.css */
:root {
  --color-bg:            #f0f6ff;   /* near-white light blue — page background */
  --color-surface:       #ffffff;   /* card and form surface */
  --color-primary:       #2563eb;   /* blue accent — buttons, headings */
  --color-primary-hover: #1d4ed8;
  --color-text:          #1e293b;   /* dark body text */
  --color-text-muted:    #64748b;   /* subtitles, placeholders */
  --color-error:         #dc2626;   /* error messages */
  --color-success:       #16a34a;   /* "Copied!" feedback */
  --border-radius:       8px;
  --shadow:              0 2px 8px rgba(0,0,0,0.08);
}
/* Responsive breakpoint: 768px (single-column below, wider above) */
```

---

## Error Handling

Four distinct error categories, each with a defined display location and state field:

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Validation Error (client-side, before any API call)           │
│  Trigger : topic empty or whitespace-only when Generate clicked  │
│  State   : validationError: string                               │
│  Display : inline below TopicInput                               │
│  Message : "Please enter a study topic."                         │
│  Effect  : no API call dispatched, form stays enabled            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. API / Bedrock Error (server returned an error object)         │
│  Trigger : bedrockService throws, or HTTP 500 from Express       │
│  State   : errorMessage: string                                  │
│  Display : ErrorBanner between InputForm and OutputSection       │
│  Message : "Unable to generate notes. Please try again."         │
│  Effect  : isLoading = false, form re-enabled,                   │
│            previous OutputCards remain visible and unchanged     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. Partial Parse Error (response missing one or more sections)   │
│  Trigger : parseNotes cannot identify a section heading          │
│  State   : partialError: string (lists missing section names)    │
│  Display : ErrorBanner below rendered cards                      │
│  Effect  : available cards rendered; missing cards skipped       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. Clipboard Error (Copy All Notes)                              │
│  Trigger a: writeText() rejects                                  │
│    → button label → "Copy Failed" for 2 s, then reverts          │
│  Trigger b: navigator.clipboard undefined                        │
│    → fallback message shown to user                              │
└──────────────────────────────────────────────────────────────────┘

All error states (validationError, errorMessage, partialError) are
cleared at the start of each new generateNotes() call.
```

---

## Correctness Properties

These are the formal properties the implementation must satisfy. They map directly to requirements and can be verified with property-based or unit tests.

### Property 1: Validation Gate

`generateNotes()` called with a whitespace-only or empty topic must never dispatch an HTTP request. The function must set `validationError` and return without any side effect on `isLoading` or `notes`.

**Validates: Requirements 2.3, 2.4, 6.1**

### Property 2: Loading Exclusivity

`isLoading` is `true` if and only if exactly one in-flight HTTP request exists. It must transition to `false` on the first response (success or error), regardless of whether subsequent duplicate responses arrive.

**Validates: Requirements 4.1, 4.2**

### Property 3: Form Disabled While Loading

When `isLoading` is `true`, the topic input, level dropdown, and Generate Notes button are all disabled. When `isLoading` becomes `false`, all three are re-enabled (Generate Notes button re-enable is conditional on topic being non-empty).

**Validates: Requirements 2.5, 2.6, 4.3, 4.4**

### Property 4: Notes Immutability on Failure

A failed `generateNotes()` call must leave `notes` state identical to its value before the call was made. It must not set `notes` to `null` or a partial value.

**Validates: Requirements 6.3**

### Property 5: Clear Is Idempotent

Calling `clearForm()` on an already-cleared form (topic empty, level Beginner, notes null, no errors) produces no observable state change.

**Validates: Requirements 8.2, 8.3**

### Property 6: Card Order Invariant

When `notes` is non-null, `OutputSection` always renders cards in the fixed order: Simple Explanation, Key Points, Important Definitions, Quiz Yourself, Quick Revision Summary. The order must not depend on the order in which sections appear in the Bedrock response.

**Validates: Requirements 5.1**

### Property 7: Copy Button Label Reversion

After a copy attempt (success or failure), the button label must return to "Copy All Notes" after exactly 2 seconds, regardless of whether additional copy attempts are made during that window.

**Validates: Requirements 7.3, 7.4**

### Property 8: Errors Cleared on New Attempt

At the moment `generateNotes()` dispatches the HTTP request, `errorMessage`, `partialError`, and `validationError` must all be empty strings.

**Validates: Requirements 6.4**

### Property 9: Timeout Is 60 Seconds

The AbortController timeout in `bedrockService` must be set to 60 000 ms. An aborted request must produce `errorType: "TIMEOUT"`.

**Validates: Requirements 3.5**

### Property 10: No Hard-Coded Credentials

The compiled server bundle must contain no literal values of `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`. All four env vars must be read exclusively via `process.env`.

**Validates: Requirements 9.2**

---

## Testing Strategy

Tests are kept proportional to a university demo project — straightforward unit tests and one integration smoke test.

### Unit Tests

| File under test | What to test |
|---|---|
| `utils/parseNotes.ts` | Returns all 5 sections correctly; returns `missingSections` array when a heading is absent; handles empty string input gracefully. |
| `utils/clipboardHelper.ts` | Produces correctly formatted plain text with expected blank-line separators between sections. |
| `hooks/useNotesGenerator.ts` | Validation gate (Correctness Property 1); notes immutability on failure (Property 4); clear idempotency (Property 5). |
| `services/bedrockService.ts` | Returns parsed text on a mocked successful Bedrock response; throws `TIMEOUT` error when AbortController fires; throws `BEDROCK_ERROR` on HTTP 500 from a mocked client. |

### Integration Test

One end-to-end smoke test:
- Start the Express server with mocked AWS credentials and a stubbed Bedrock response.
- POST to `/api/generate` with a valid topic and level.
- Assert HTTP 200 and that the response `text` field contains all five section headings.

### Manual Acceptance Checks

Before deployment, manually verify:
- Responsive layout at 375 px, 768 px, and 1280 px viewport widths.
- Sequential card entrance animation is visible.
- Copy All Notes produces correct clipboard content.
- Clear resets all fields and removes cards.
- Loading spinner appears and disappears correctly.
- Error banner shows and clears on retry.

---

## Requirement Traceability

| Requirement | Satisfied By |
|---|---|
| Req 1 — Branding & Layout | `Header.tsx`, `index.css` (theme tokens, 768 px breakpoint) |
| Req 2 — Input & Level | `TopicInput.tsx`, `LevelSelect.tsx`, `FormActions.tsx`, `useNotesGenerator.ts` |
| Req 3 — Bedrock Integration | `server/bedrockService.ts`, `server/index.ts`, `useNotesGenerator.ts` |
| Req 4 — Loading State | `LoadingSpinner.tsx`, `useNotesGenerator.ts` (`isLoading`) |
| Req 5 — Output Cards | `OutputSection.tsx`, `OutputCard.tsx`, `parseNotes.ts` |
| Req 6 — Error Handling | `ErrorBanner.tsx`, `useNotesGenerator.ts` (`errorMessage`, `validationError`, `partialError`) |
| Req 7 — Copy All Notes | `CopyButton.tsx`, `clipboardHelper.ts` |
| Req 8 — Clear Form | `FormActions.tsx`, `useNotesGenerator.ts` (`clearForm`) |
| Req 9 — Deployment | `server/index.ts`, `.env.example`, `README.md`, root `package.json` scripts |
