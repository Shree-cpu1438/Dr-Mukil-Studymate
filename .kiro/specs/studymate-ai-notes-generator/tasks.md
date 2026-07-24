# Implementation Plan: StudyMate — AI Topic Notes Generator

## Overview

Implement a React + TypeScript + Vite frontend connected to a lightweight Express backend that proxies requests to Amazon Bedrock. The project is built incrementally: shared types and utilities first, then the backend service, then the frontend hook and components, then styles and layout, finishing with deployment scaffolding and documentation.

---

## Tasks

- [x] 1. Scaffold project structure and shared types
  - [x] 1.1 Initialise root `package.json` with workspaces, and root scripts: `dev`, `build`, `start`
    - Create root `package.json` with `workspaces: ["client", "server"]`
    - Add `dev` (runs Vite + ts-node concurrently), `build` (Vite build + tsc for server), `start` (node server/dist) scripts
    - _Requirements: 9.1_

  - [x] 1.2 Bootstrap the Vite + React + TypeScript client
    - Run `npm create vite@latest client -- --template react-ts` (or equivalent scaffold)
    - Verify `client/tsconfig.json`, `client/vite.config.ts`, and `client/index.html` exist
    - Add `/api` proxy to `vite.config.ts` pointing to `http://localhost:3001`
    - _Requirements: 9.1_

  - [x] 1.3 Initialise the Express server package
    - Create `server/package.json` with dependencies: `express`, `@aws-sdk/client-bedrock-runtime`, `cors`, `dotenv`; devDependencies: `typescript`, `ts-node`, `@types/express`, `@types/node`
    - Create `server/tsconfig.json` targeting Node 18 with `outDir: dist`
    - _Requirements: 9.1, 9.2_

  - [x] 1.4 Define shared TypeScript types in `client/src/types/index.ts`
    - Export `StudyLevel` union type (`'Beginner' | 'Intermediate' | 'Advanced'`)
    - Export `ParsedNotes` interface (5 string fields)
    - Export `BedrockError` interface (`errorType`, `message`)
    - Export `ParseResult` interface (`notes: Partial<ParsedNotes>`, `missingSections: string[]`)
    - _Requirements: 3.1, 5.1_

- [x] 2. Implement backend service and API route
  - [x] 2.1 Implement `server/bedrockService.ts`
    - Read `AWS_REGION`, `AWS_MODEL_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` from `process.env` at module load — no hard-coded values
    - Instantiate `BedrockRuntimeClient` with region and credentials from env vars
    - Export `generateNotes(topic: string, level: StudyLevel): Promise<string>` with full JSDoc (params, return type, env vars required, error conditions)
    - Build the exact AI prompt specified in Req 3.1, substituting `topic` and `level`
    - Create `AbortController` with a `setTimeout` of 60 000 ms
    - Send `InvokeModelCommand` with `modelId: process.env.AWS_MODEL_ID`, `body: JSON.stringify({ prompt, max_tokens: 2048 })`, and `signal: controller.signal`
    - Decode and return the plain text response body on success
    - On `AbortError`: throw `{ errorType: "TIMEOUT", message: "Request timed out after 60 seconds." }`
    - On any other error: throw `{ errorType: "BEDROCK_ERROR", message: err.message }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.2_

  - [ ]* 2.2 Write unit tests for `bedrockService.ts`
    - **Property 9: Timeout Is 60 Seconds** — mock `AbortController`; assert that aborting produces `errorType: "TIMEOUT"`
    - **Validates: Requirements 3.5**
    - Test: mocked successful Bedrock response returns decoded plain text string
    - Test: HTTP 500 from mocked client throws `{ errorType: "BEDROCK_ERROR" }`
    - _Requirements: 3.4, 3.5_

  - [x] 2.3 Implement `server/index.ts` — Express app and `/api/generate` route
    - Load `dotenv` at startup (`dotenv.config()`)
    - Mount JSON body parser and CORS middleware
    - Implement `POST /api/generate`: validate `{ topic, level }` in request body; call `bedrockService.generateNotes`; return `HTTP 200 { text }` on success; return `HTTP 500 { errorType, message }` on caught error
    - Serve `client/dist` as static files in production (`express.static`)
    - Listen on `process.env.PORT ?? 3001`
    - _Requirements: 3.2, 9.1, 9.2_

  - [ ]* 2.4 Write integration smoke test for `POST /api/generate`
    - Start Express with a stubbed `bedrockService.generateNotes` that returns a fixed multi-section string
    - POST `{ topic: "Photosynthesis", level: "Beginner" }` to `/api/generate`
    - Assert `HTTP 200` and `response.body.text` contains all five section headings
    - _Requirements: 3.1, 3.2_

- [x] 3. Checkpoint — backend passes all tests
  - Ensure all backend unit and integration tests pass, ask the user if questions arise.

- [x] 4. Implement client utilities
  - [x] 4.1 Implement `client/src/utils/parseNotes.ts`
    - Export `parseNotes(rawText: string): ParseResult`
    - Identify each of the five section headings in the raw Bedrock text (case-insensitive matching)
    - Extract content between consecutive headings; populate `ParsedNotes` fields
    - Populate `missingSections` with the names of any headings not found
    - Return `{ notes: Partial<ParsedNotes>, missingSections }`
    - _Requirements: 5.1, 5.3_

  - [ ]* 4.2 Write property test for `parseNotes`
    - **Property 6: Card Order Invariant** — generate arbitrary permutations of the five section headings; assert that `parseNotes` always maps each heading to the correct `ParsedNotes` field regardless of input order
    - **Validates: Requirements 5.1**
    - Unit test: all 5 sections present → `missingSections` is empty
    - Unit test: one heading absent → correct field missing, `missingSections` contains that section name
    - Unit test: empty string input → all five listed in `missingSections`, no thrown error
    - _Requirements: 5.1, 5.3_

  - [x] 4.3 Implement `client/src/utils/clipboardHelper.ts`
    - Export `formatNotesForClipboard(notes: ParsedNotes): string`
    - Each card: section title on its own line, blank line, content, blank line between cards
    - _Requirements: 7.2_

  - [ ]* 4.4 Write unit tests for `clipboardHelper.ts`
    - Assert output contains all five section titles in order
    - Assert blank-line separators are present between consecutive cards
    - _Requirements: 7.2_

- [ ] 5. Implement `useNotesGenerator` hook
  - [x] 5.1 Scaffold `client/src/hooks/useNotesGenerator.ts` with all state fields
    - Declare state: `topic`, `level`, `isLoading`, `notes`, `errorMessage`, `validationError`, `partialError`, `copyButtonLabel`
    - Initialise `level` to `'Beginner'`, all strings to `''`, booleans to `false`, notes to `null`, `copyButtonLabel` to `'Copy All Notes'`
    - Export the `UseNotesGeneratorReturn` interface and the hook
    - _Requirements: 2.2, 4.1_

  - [x] 5.2 Implement `setTopic`, `setLevel`, and validation logic inside the hook
    - `setTopic` updates `topic` state; clears `validationError` if new value is non-empty non-whitespace
    - `generateNotes` validates topic before dispatching: if empty/whitespace set `validationError` and return without touching `isLoading` or `notes`
    - _Requirements: 2.3, 2.4, 6.1_

  - [x]* 5.3 Write property test for validation gate
    - **Property 1: Validation Gate** — for any string consisting solely of whitespace characters (spaces, tabs, newlines), assert that calling `generateNotes()` sets `validationError` to a non-empty string, leaves `isLoading === false`, and leaves `notes` unchanged
    - **Validates: Requirements 2.3, 2.4, 6.1**
    - _Requirements: 2.3, 2.4, 6.1_

  - [x] 5.4 Implement `generateNotes` async flow inside the hook
    - Clear `errorMessage`, `partialError`, `validationError`; set `isLoading = true`
    - `fetch('POST /api/generate', { topic, level })` with JSON body
    - On HTTP 200: call `parseNotes(data.text)`; set `notes` and (if `missingSections` non-empty) set `partialError`
    - On non-200 or `fetch` rejection: set `errorMessage = "Unable to generate notes. Please try again."` — leave existing `notes` unchanged
    - Always set `isLoading = false` in a `finally` block
    - _Requirements: 4.1, 4.2, 6.2, 6.3, 6.4_

  - [x]* 5.5 Write property tests for loading state and notes immutability
    - **Property 2: Loading Exclusivity** — mock `fetch` to resolve after a delay; assert `isLoading` becomes `true` immediately and `false` exactly once after the response arrives
    - **Property 4: Notes Immutability on Failure** — pre-set `notes` to a known value; mock `fetch` to reject; assert `notes` is identical after the call
    - **Validates: Requirements 4.1, 4.2, 6.3**
    - _Requirements: 4.1, 4.2, 6.3_

  - [ ] 5.6 Implement `clearForm` action inside the hook
    - Reset `topic` to `''`, `level` to `'Beginner'`, `notes` to `null`, clear `errorMessage`, `validationError`, `partialError`
    - _Requirements: 8.2, 8.3_

  - [x]* 5.7 Write property test for `clearForm` idempotency
    - **Property 5: Clear Is Idempotent** — call `clearForm()` on an already-reset hook; assert all state fields are identical before and after the second call
    - **Validates: Requirements 8.2, 8.3**
    - _Requirements: 8.2, 8.3_

  - [x] 5.8 Implement `copyNotes` action and `copyButtonLabel` state inside the hook
    - If `navigator.clipboard` is undefined: set a fallback message state visible to the user
    - Otherwise call `formatNotesForClipboard(notes!)` and `navigator.clipboard.writeText(...)`
    - On success: set `copyButtonLabel = 'Copied!'`; after 2 000 ms revert to `'Copy All Notes'`
    - On rejection: set `copyButtonLabel = 'Copy Failed'`; after 2 000 ms revert to `'Copy All Notes'`
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.9 Write property test for copy button label reversion
    - **Property 7: Copy Button Label Reversion** — use fake timers; mock a successful clipboard write; advance clock by 2 000 ms; assert label is `'Copy All Notes'`; repeat with a failing clipboard write
    - **Validates: Requirements 7.3, 7.4**
    - _Requirements: 7.3, 7.4_

- [x] 6. Checkpoint — hook logic passes all tests
  - Ensure all hook unit and property tests pass, ask the user if questions arise.

- [ ] 7. Implement presentational components
  - [~] 7.1 Implement `Header.tsx`
    - Render `<h1>StudyMate: AI Topic Notes Generator</h1>` and `<p>Generate easy-to-understand study notes for any topic using AI.</p>`
    - Create `Header.css` with heading and subtitle styles
    - _Requirements: 1.1, 1.2_

  - [~] 7.2 Implement `TopicInput.tsx`
    - Controlled `<input type="text">` labelled "Enter a study topic" with placeholder "Example: Ohm's Law, Photosynthesis, Python Loops"
    - Render inline validation message below input when `validationError` is non-empty
    - Disable input when `disabled` prop is `true`
    - Create `TopicInput.css`
    - _Requirements: 2.1, 2.4, 2.5, 6.1_

  - [~] 7.3 Implement `LevelSelect.tsx`
    - Controlled `<select>` labelled "Study Level" with options Beginner, Intermediate, Advanced
    - Default to Beginner; disable when `disabled` prop is `true`
    - Create `LevelSelect.css`
    - _Requirements: 2.2, 2.5_

  - [~] 7.4 Implement `FormActions.tsx`
    - Render "Generate Notes" button (disabled when `generateDisabled` or `isLoading` is `true`) and "Clear" button (always enabled)
    - Wire `onClick` handlers to `onGenerate` and `onClear` props
    - Create `FormActions.css`
    - _Requirements: 2.3, 8.1_

  - [~] 7.5 Implement `InputForm.tsx`
    - Compose `TopicInput`, `LevelSelect`, and `FormActions` inside a `<form>` element
    - Prevent default form submission; call `onGenerate` on submit
    - Create `InputForm.css`
    - _Requirements: 2.1, 2.2, 2.3_

  - [~] 7.6 Implement `LoadingSpinner.tsx`
    - Render an animated CSS spinner element (no props)
    - Create `LoadingSpinner.css` with keyframe rotation animation
    - _Requirements: 4.1, 4.2, 4.3_

  - [~] 7.7 Implement `ErrorBanner.tsx`
    - Render a visible error container when `message` prop is non-empty; render nothing when empty
    - Create `ErrorBanner.css`
    - _Requirements: 6.2_

  - [~] 7.8 Implement `OutputCard.tsx`
    - Accept `title`, `content`, and `animationDelay` props
    - Apply a CSS entrance animation (`opacity 0 → 1`, `transform translateY`) with `animationDelay` ms applied via inline `style`; animation duration 300–500 ms
    - Create `OutputCard.css`
    - _Requirements: 5.1, 5.2_

  - [~] 7.9 Implement `CopyButton.tsx`
    - Render a `<button>` whose label is the `label` prop (`'Copy All Notes'` | `'Copied!'` | `'Copy Failed'`)
    - Apply success colour (`--color-success`) when label is `'Copied!'`; error colour when `'Copy Failed'`
    - Create `CopyButton.css`
    - _Requirements: 7.1, 7.3, 7.4_

  - [~] 7.10 Implement `OutputSection.tsx`
    - Render only when `notes` prop is non-null
    - Render five `OutputCard` components in fixed order: Simple Explanation, Key Points, Important Definitions, Quiz Yourself, Quick Revision Summary; pass sequential `animationDelay` (e.g. 0, 100, 200, 300, 400 ms)
    - Render `CopyButton` and partial-error message (when `partialError` is non-empty)
    - Create `OutputSection.css`
    - _Requirements: 5.1, 5.2, 5.3, 7.1_

  - [~] 7.11 Implement `Footer.tsx`
    - Render a simple footer with branding text
    - Create `Footer.css`
    - _Requirements: 1.1_

- [ ] 8. Wire everything together in `App.tsx` and apply global styles
  - [~] 8.1 Implement `App.tsx`
    - Call `useNotesGenerator()` and destructure all returned state and actions
    - Render `Header`, `InputForm`, `ErrorBanner`, `LoadingSpinner` (conditionally on `isLoading`), `OutputSection` (conditionally on `notes !== null`), `Footer`
    - Pass correct props from hook return values to each component
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 5.1, 6.2_

  - [~] 8.2 Implement global styles in `client/src/index.css`
    - Define all CSS custom properties from the design: `--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-muted`, `--color-error`, `--color-success`, `--border-radius`, `--shadow`
    - Apply `--color-bg` to `body` background; `--color-text` to body font
    - Implement responsive layout: single-column below 768 px, wider layout at 768 px and above using a CSS media query
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ]* 8.3 Write property test for card order invariant (render level)
    - **Property 6: Card Order Invariant** — render `OutputSection` with a `ParsedNotes` object; assert the five `OutputCard` titles appear in the DOM in exactly the fixed order regardless of object key order
    - **Validates: Requirements 5.1**
    - _Requirements: 5.1_

  - [ ]* 8.4 Write property test for form disabled while loading
    - **Property 3: Form Disabled While Loading** — render `App` with `isLoading = true`; assert topic input, level dropdown, and Generate Notes button all have `disabled` attribute; set `isLoading = false`; assert all three are enabled (Generate Notes conditional on non-empty topic)
    - **Validates: Requirements 2.5, 2.6, 4.3, 4.4**
    - _Requirements: 2.5, 2.6, 4.3, 4.4_

  - [ ]* 8.5 Write property test for errors cleared on new attempt
    - **Property 8: Errors Cleared on New Attempt** — pre-set `errorMessage`, `partialError`, `validationError` to non-empty strings; trigger `generateNotes()` with a valid topic (mock fetch); assert all three are empty strings at the moment the request is dispatched
    - **Validates: Requirements 6.4**
    - _Requirements: 6.4_

- [~] 9. Checkpoint — full test suite passes
  - Ensure all unit, property, and integration tests pass, ask the user if questions arise.

- [ ] 10. Add deployment scaffolding and documentation
  - [~] 10.1 Create `.env.example` at the project root
    - List all four env vars (`AWS_REGION`, `AWS_MODEL_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) with empty values and inline comments
    - _Requirements: 9.2_

  - [~] 10.2 Add JSDoc documentation to all exported functions in `bedrockService.ts`
    - Document `generateNotes`: param names and types, return value (`Promise<string>`), env vars required, all error conditions including TIMEOUT and BEDROCK_ERROR
    - _Requirements: 9.3_

  - [~] 10.3 Write `README.md` at the project root
    - Include all seven required sections: Project Overview, Features, Prerequisites, Environment Variables (table of all four vars), Local Setup, Running the Application, Public Deployment Instructions
    - _Requirements: 9.4_

  - [~] 10.4 Verify single-command build produces deployable artifact
    - Run `npm run build` from the root; confirm `client/dist/` (static assets) and `server/dist/` (compiled Node bundle) are produced with zero errors
    - Confirm `npm run start` serves both static files and `POST /api/generate` from a single process
    - _Requirements: 9.1_

- [~] 11. Final checkpoint — deployment ready
  - Ensure the build succeeds, the production server starts, and all tests pass. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each major phase
- Property tests validate the formal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The backend is intentionally flat (two files): keep it that way — no routers, no middleware folders

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.4", "4.1", "4.3"] },
    { "id": 4, "tasks": ["4.2", "4.4", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.6"] },
    { "id": 6, "tasks": ["5.3", "5.4", "5.7"] },
    { "id": 7, "tasks": ["5.5", "5.8"] },
    { "id": 8, "tasks": ["5.9", "7.1", "7.2", "7.3", "7.4", "7.6", "7.7", "7.8", "7.9"] },
    { "id": 9, "tasks": ["7.5", "7.10", "7.11"] },
    { "id": 10, "tasks": ["8.1", "8.2"] },
    { "id": 11, "tasks": ["8.3", "8.4", "8.5"] },
    { "id": 12, "tasks": ["10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
