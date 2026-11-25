import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']);
const ALLOWED_WORDS = new Set(['Square', 'Circle', 'Apple', 'House', 'Star', 'Ready']);

const audioCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Check Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function synthesizeWord(text: string, voiceName: string): Promise<Buffer> {
  const cacheKey = `${voiceName}:${text}`;
  const cached = audioCache.get(cacheKey);
  if (cached) return cached;

  const existing = inFlightRequests.get(cacheKey);
  if (existing) return existing;

  const task = (async () => {
    const ai = getGeminiClient();
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  speechMetadata: {
                    style: 'Clear, loud, crisp single-word announcement',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
          throw new Error('Gemini TTS returned no audio data.');
        }

        const wavBuffer = Buffer.from(base64Audio, 'base64');
        audioCache.set(cacheKey, wavBuffer);
        return wavBuffer;
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    }

    throw lastError;
  })();

  inFlightRequests.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '16kb' }));

  app.post('/api/tts', async (req, res) => {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const rawVoice = typeof req.body?.voiceName === 'string' ? req.body.voiceName.trim() : 'Kore';

    if (!ALLOWED_WORDS.has(rawText)) {
      res.status(400).json({ error: 'Unsupported announcement word.' });
      return;
    }

    if (!ALLOWED_VOICES.has(rawVoice)) {
      res.status(400).json({ error: 'Unsupported Gemini voice.' });
      return;
    }

    try {
      const wavBuffer = await synthesizeWord(rawText, rawVoice);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(wavBuffer);
    } catch (err: any) {
      const status = typeof err?.status === 'number' ? err.status : 500;
      const message =
        err?.message || 'Failed to generate voice audio from Gemini TTS.';
      console.error('[TTS Error]', message);
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
