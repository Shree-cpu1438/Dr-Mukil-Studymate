# Requirements Document

## Introduction

StudyMate: AI Topic Notes Generator is a web application that helps students quickly understand any topic by generating AI-powered study notes. Using Amazon Bedrock as the AI backend, the application accepts a study topic and a preferred study level (Beginner, Intermediate, or Advanced), then produces five structured output cards in a fixed order: a simple explanation, key points, important definitions, quiz questions with answers, and a quick revision summary. The application is intentionally simple and clean — suited for a university demonstration — with a responsive light blue and white interface, smooth result animations, and utility actions (Copy All Notes and Clear). All AWS configuration is supplied exclusively through environment variables, and the application is designed for straightforward public deployment with minimal configuration.

## Glossary

- **Application**: The StudyMate: AI Topic Notes Generator web application.
- **User**: A student or learner interacting with the Application.
- **Topic**: A study subject entered by the User as free text (e.g., "Ohm's Law", "Photosynthesis", "Python Loops").
- **Study_Level**: The selected difficulty level for generated notes — one of: Beginner, Intermediate, or Advanced.
- **Notes_Generator**: The frontend component responsible for collecting input, triggering AI generation, and rendering results.
- **Bedrock_Client**: The backend service module responsible for constructing prompts, invoking Amazon Bedrock, and returning AI-generated text or structured errors.
- **Output_Card**: A discrete UI section displaying one category of generated notes (Simple Explanation, Key Points, Important Definitions, Quiz Yourself, or Quick Revision Summary).
- **Loading_Spinner**: A visual indicator displayed while the active AI request is being processed.
- **Copy_Button**: The "Copy All Notes" action button that copies all visible Output_Card content to the clipboard.
- **Clear_Button**: The action button that resets the form and removes all generated notes and error messages.
- **AI_Prompt**: The structured prompt sent to Amazon Bedrock, incorporating the Topic and Study_Level.

---

## Requirements

### Requirement 1: Application Layout and Branding

**User Story:** As a student, I want to see a clearly branded, visually appealing application so that I immediately understand the purpose of the tool.

#### Acceptance Criteria

1. THE Application SHALL display the title "StudyMate: AI Topic Notes Generator" as the primary heading on the page.
2. THE Application SHALL display the description "Generate easy-to-understand study notes for any topic using AI." directly below the title.
3. THE Application SHALL use a light theme where: the page background is white or a near-white light colour, interactive elements (buttons, active controls) use a blue accent colour, and body text uses a dark colour on the light background to maintain readable contrast.
4. THE Application SHALL render a single-column layout on viewports narrower than 768 px, stacking all sections vertically with no horizontal overflow.
5. THE Application SHALL render a wider layout on viewports 768 px wide and above, making better use of the available horizontal space for the input form and output cards.

---

### Requirement 2: Topic Input and Study Level Selection

**User Story:** As a student, I want to enter a study topic and choose my study level so that the generated notes match my current understanding.

#### Acceptance Criteria

1. THE Notes_Generator SHALL display a text input field labelled "Enter a study topic" with placeholder text "Example: Ohm's Law, Photosynthesis, Python Loops".
2. THE Notes_Generator SHALL display a dropdown labelled "Study Level" containing exactly three options: Beginner, Intermediate, and Advanced, with "Beginner" as the default selected value on initial page load and after every Clear action.
3. THE Notes_Generator SHALL keep the "Generate Notes" button disabled when the Topic field is empty or contains only whitespace characters, and SHALL enable it only when the Topic field contains at least one non-whitespace character.
4. WHEN the User clicks "Generate Notes" and the Topic field is empty or contains only whitespace, THE Notes_Generator SHALL display the inline validation message "Please enter a study topic." adjacent to the Topic input field and SHALL NOT dispatch a request to the Bedrock_Client.
5. WHILE the Bedrock_Client is processing a request, THE Notes_Generator SHALL disable the "Generate Notes" button, the Topic input field, and the Study_Level dropdown to prevent duplicate submissions.
6. WHEN the Bedrock_Client returns any response (success or error), THE Notes_Generator SHALL re-enable the "Generate Notes" button, the Topic input field, and the Study_Level dropdown.

---

### Requirement 3: AI Prompt Construction and Bedrock Integration

**User Story:** As a student, I want the application to send a well-structured prompt to the AI so that I receive comprehensive, level-appropriate study notes.

#### Acceptance Criteria

1. WHEN the User clicks "Generate Notes" with a non-empty, non-whitespace-only Topic of 500 characters or fewer, THE Bedrock_Client SHALL construct and send the following prompt to Amazon Bedrock, substituting `{Topic}` and `{Level}` with the User-supplied values:
   > "You are an expert tutor. Explain the topic: {Topic}. Study level: {Level}. Generate: 1. Simple Explanation 2. Key Points (bullet list) 3. Important Definitions 4. Three Quiz Questions with Answers 5. A Short Revision Summary. Use clear headings and simple language."
2. THE Bedrock_Client SHALL invoke a text-generation foundation model on Amazon Bedrock where the model identifier is read exclusively from the `AWS_MODEL_ID` environment variable.
3. THE Bedrock_Client SHALL reside in a dedicated service module (its own file) that exports only its public interface and does not import from UI layer modules, so it can be tested independently without rendering the UI.
4. IF the Bedrock_Client receives an HTTP error status or a service exception from Amazon Bedrock, THEN THE Bedrock_Client SHALL return an error object containing at minimum an `errorType` string and a human-readable `message` string to the Notes_Generator.
5. IF the Bedrock_Client receives no response from Amazon Bedrock within 60 seconds, THEN THE Bedrock_Client SHALL abort the request and return an error object with `errorType` "TIMEOUT" and a human-readable `message` string to the Notes_Generator.

---

### Requirement 4: Loading State

**User Story:** As a student, I want to see a loading indicator while notes are being generated so that I know the application is working.

#### Acceptance Criteria

1. WHEN the User clicks "Generate Notes" with a valid Topic, THE Notes_Generator SHALL display the Loading_Spinner immediately, before the request is dispatched to the Bedrock_Client.
2. WHEN the Bedrock_Client returns a response (success or error), THE Notes_Generator SHALL hide the Loading_Spinner. The Loading_Spinner SHALL remain hidden for any subsequent delayed or duplicate responses from the same request.
3. WHILE the Loading_Spinner is visible, THE Notes_Generator SHALL keep the "Generate Notes" button, the Topic input field, and the Study_Level dropdown disabled.
4. WHEN the Loading_Spinner is hidden after a completed request, THE Notes_Generator SHALL re-enable the Topic input field and the Study_Level dropdown, and SHALL re-enable the "Generate Notes" button only if the Topic field contains at least one non-whitespace character.

---

### Requirement 5: Output Cards Display

**User Story:** As a student, I want to see my generated notes organised into clearly labelled sections so that I can easily navigate and study each part.

#### Acceptance Criteria

1. WHEN the Bedrock_Client returns a successful AI response, THE Notes_Generator SHALL display exactly five Output_Cards in the following fixed order, each labelled with its section title:
   - Card 1 — **Simple Explanation**: an explanation whose vocabulary and depth match the selected Study_Level (Beginner uses everyday language, Intermediate introduces subject terminology, Advanced assumes prior domain knowledge).
   - Card 2 — **Key Points**: between 5 and 8 bullet points (inclusive) covering the most important information about the Topic.
   - Card 3 — **Important Definitions**: key terms relevant to the Topic, each followed by its definition.
   - Card 4 — **Quiz Yourself**: exactly 3 quiz questions, each with its answer displayed directly below the question.
   - Card 5 — **Quick Revision Summary**: a concise summary of between 4 and 6 sentences.
2. WHEN the Output_Cards appear, THE Notes_Generator SHALL apply a sequential entrance animation of 300 ms to 500 ms per card so that cards appear one after another rather than all at once.
3. IF the Bedrock_Client returns a response in which one or more of the five sections are absent or cannot be parsed, THEN THE Notes_Generator SHALL render the successfully parsed cards and display a single error message identifying which sections could not be loaded.

---

### Requirement 6: Error Handling

**User Story:** As a student, I want clear error messages when something goes wrong so that I understand what happened and can take corrective action.

#### Acceptance Criteria

1. IF the User clicks "Generate Notes" while the Topic field is empty or contains only whitespace, THEN THE Notes_Generator SHALL display the message "Please enter a study topic." adjacent to the Topic input field and SHALL NOT dispatch a request to the Bedrock_Client.
2. IF the Bedrock_Client returns an error object, THEN THE Notes_Generator SHALL display the message "Unable to generate notes. Please try again." in a dedicated error message area positioned between the input section and the output section.
3. WHEN a generation request fails, THE Notes_Generator SHALL NOT render any new Output_Cards for that failed request; any Output_Cards from a prior successful generation SHALL remain visible and unchanged on the page.
4. WHEN the User clicks "Generate Notes" to start a new generation request, THE Notes_Generator SHALL clear any error message currently shown in the error message area before dispatching the request to the Bedrock_Client.

---

### Requirement 7: Copy All Notes

**User Story:** As a student, I want to copy all generated notes to my clipboard with a single click so that I can paste them into my own notes application.

#### Acceptance Criteria

1. WHILE at least one Output_Card is visible on the page, THE Notes_Generator SHALL display the Copy_Button labelled "Copy All Notes".
2. WHEN the User clicks the Copy_Button, THE Notes_Generator SHALL write the plain-text content of all five Output_Cards to the system clipboard. Each card's section title and body SHALL be separated by a blank line, and consecutive cards SHALL be separated from each other by a blank line.
3. WHEN the clipboard write operation succeeds, THE Notes_Generator SHALL change the Copy_Button label to "Copied!" and, after exactly 2 seconds, revert the label to "Copy All Notes".
4. WHEN the clipboard write operation fails for any reason other than the clipboard API being unavailable, THE Notes_Generator SHALL change the Copy_Button label to "Copy Failed" and, after exactly 2 seconds, revert the label to "Copy All Notes".
5. IF the clipboard API is unavailable in the User's browser, THEN THE Notes_Generator SHALL display a message instructing the User to manually select and copy the text from the page.

---

### Requirement 8: Clear Form

**User Story:** As a student, I want a clear button to reset the form so that I can quickly start a new study session without manually deleting previous inputs.

#### Acceptance Criteria

1. THE Notes_Generator SHALL display the Clear_Button labelled "Clear" at all times while the form is rendered.
2. WHEN the User clicks the Clear_Button, THE Notes_Generator SHALL: reset the Topic input field to empty, reset the Study_Level dropdown to "Beginner", and remove all Output_Cards and error messages currently shown on the page.
3. WHEN the User clicks the Clear_Button while the Topic field is already empty, the Study_Level is already set to "Beginner", and no Output_Cards or error messages are visible, THE Notes_Generator SHALL make no observable state change.

---

### Requirement 9: Deployment Readiness

**User Story:** As a developer, I want the application to be structured for straightforward public deployment so that it can be hosted and accessed by students anywhere with minimal configuration.

#### Acceptance Criteria

1. THE Application SHALL be buildable via a single command that produces a deployable artifact (a `dist` or `build` directory of static files, or a runnable server bundle) with zero build errors and zero unresolved dependencies.
2. THE Application SHALL read all environment-specific configuration exclusively from the following four environment variables and SHALL NOT hard-code any of these values anywhere in the source code:
   - `AWS_REGION` — the AWS region where the Bedrock model is hosted.
   - `AWS_MODEL_ID` — the Amazon Bedrock model identifier to invoke.
   - `AWS_ACCESS_KEY_ID` — the AWS access key for authenticating requests.
   - `AWS_SECRET_ACCESS_KEY` — the AWS secret key for authenticating requests.
3. THE Bedrock_Client module SHALL include inline code documentation (JSDoc or equivalent) for each exported function, covering: parameter names and types, return value structure including the error object shape (`errorType` and `message`), the environment variables required at runtime, and all documented error conditions including timeout.
4. THE Application SHALL include a README file containing all of the following sections:
   - **Project Overview** — what the application does and who it is for.
   - **Features** — a list of the application's main capabilities.
   - **Prerequisites** — software and accounts required before setup.
   - **Environment Variables** — a table or list of all four variables from Criterion 2 with descriptions.
   - **Local Setup** — step-by-step instructions for installing dependencies and running the application locally.
   - **Running the Application** — how to start the development server and access the app in a browser.
   - **Public Deployment Instructions** — step-by-step guidance for deploying to a public hosting platform (e.g., AWS Amplify, Vercel, or Netlify).
