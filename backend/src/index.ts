import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import { groq, GROQ_MODEL } from './config/groq';
import incidentsRouter from './routes/incidents';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Temporary test route to confirm Groq API connectivity
app.get('/api/test-groq', async (_req: Request, res: Response) => {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Say hello in 5 words',
        },
      ],
    });

    res.json({
      success: true,
      message: completion.choices[0]?.message?.content || '',
      model: completion.model,
    });
  } catch (error: any) {
    console.error('Groq test request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Groq request failed',
    });
  }
});

// Mount incident routes (/api/analyze, /api/incidents, /api/incidents/:id)
app.use('/api', incidentsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
