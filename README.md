# StudyMate: AI Topic Notes Generator

## Project Overview

StudyMate is a web application that helps students quickly understand any topic by generating AI-powered study notes. Enter a subject and choose a study level (Beginner, Intermediate, or Advanced), and the application produces five structured sections: a simple explanation, key points, important definitions, quiz questions with answers, and a quick revision summary.

The application uses Amazon Bedrock as the AI backend, a React + TypeScript frontend built with Vite, and a lightweight Express server that securely proxies requests to Bedrock.

---

## Features

- Generate comprehensive study notes for any topic in seconds
- Three study levels: Beginner, Intermediate, Advanced
- Five structured output cards: Simple Explanation, Key Points, Important Definitions, Quiz Yourself, Quick Revision Summary
- Loading spinner and disabled form during generation to prevent duplicate requests
- Clear error messages for empty input and AI generation failures
- Previous successful notes remain visible if a new generation fails
- Copy All Notes button with success/failure feedback
- Clear button to reset the form and start fresh
- Responsive layout for desktop and mobile (breakpoint: 768 px)
- Clean light blue and white theme

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- An **AWS account** with Amazon Bedrock access enabled
- An **IAM user** with `bedrock:InvokeModel` permissions
- A supported **Bedrock foundation model** enabled in your AWS region (e.g. Claude 3 Haiku)

---

## Environment Variables

All four variables are required. Set them in a `.env` file at the project root (copy `.env.example`).

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region where Bedrock is available (e.g. `us-east-1`) |
| `AWS_MODEL_ID` | Bedrock model identifier (e.g. `anthropic.claude-3-haiku-20240307-v1:0`) |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret access key |

> **Security note:** The `.env` file is never committed to version control. Credentials are only read server-side and are never exposed to the browser.

---

## Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd studymate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This installs packages for the root, client, and server workspaces in one command.

3. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your four AWS values.

---

## Running the Application

Start both the Vite dev server and the Express backend together:

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001/api/generate](http://localhost:3001/api/generate)

Vite automatically proxies `/api` requests from the frontend to the Express server, so you only need to open the frontend URL.

---

## Public Deployment Instructions

### Option A — Render (recommended for simplicity)

1. Push your repository to GitHub.
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the following:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment:** Node
5. Add the four environment variables (`AWS_REGION`, `AWS_MODEL_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) in the **Environment** tab.
6. Click **Deploy**. Render handles HTTPS automatically.

### Option B — Railway

1. Push your repository to GitHub.
2. Go to [railway.app](https://railway.app) and create a new project from GitHub.
3. Set the same build/start commands and environment variables as above.
4. Deploy — Railway assigns a public URL with HTTPS.

### Option C — AWS Amplify (SSR)

1. Push your repository to GitHub.
2. Open the [AWS Amplify Console](https://console.aws.amazon.com/amplify/).
3. Connect your GitHub repository and choose **Host a web app**.
4. Set:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm run start`
5. Add the four environment variables in the **Environment variables** section.
6. Deploy.

### Option D — VPS / EC2

```bash
# On your server:
git clone <your-repo-url>
cd studymate
cp .env.example .env
# Edit .env with your AWS values
npm install
npm run build
npm run start
```

Point a reverse proxy (nginx, Caddy) at the Express port (default `3001`) and enable HTTPS via Let's Encrypt.

---

## Project Structure

```
studymate/
├── client/               # React + TypeScript + Vite frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # useNotesGenerator hook
│       ├── types/        # Shared TypeScript types
│       └── utils/        # parseNotes, clipboardHelper
├── server/               # Express backend
│   └── src/
│       ├── bedrockService.ts  # Amazon Bedrock integration
│       └── index.ts           # Express app + /api/generate route
├── .env.example          # Environment variable template
└── README.md             # This file
```
