import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root (one level above the server/ folder)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateNotes } from './bedrockService';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(cors());
app.use(express.json());

// POST /api/generate — the single API endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  const { topic, level } = req.body as { topic?: string; level?: string };

  // Basic server-side validation
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    res.status(400).json({ errorType: 'VALIDATION', message: 'Topic is required.' });
    return;
  }

  if (!level || !['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
    res.status(400).json({ errorType: 'VALIDATION', message: 'Level must be Beginner, Intermediate, or Advanced.' });
    return;
  }

  try {
    const text = await generateNotes(topic.trim(), level as 'Beginner' | 'Intermediate' | 'Advanced');
    res.status(200).json({ text });
  } catch (err: unknown) {
    const error = err as { errorType?: string; message?: string };
    res.status(500).json({
      errorType: error.errorType ?? 'UNKNOWN',
      message: error.message ?? 'An unexpected error occurred.',
    });
  }
});

// Serve the React build in production
// Use process.cwd() to resolve from the project root regardless of where the compiled file lives
const clientDist = path.join(process.cwd(), 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`StudyMate server running on port ${PORT}`);
});
