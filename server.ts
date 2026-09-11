import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for large audio payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'Open-Source Audio DSP & Rule NLP', time: new Date().toISOString() });
});

// Relay audio to Python AI Microservice
app.post('/api/analyze-tone', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/mp3', filename = 'audio.mp3', promptContext } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is missing or empty.' });
    }

    let cleanBase64 = audioBase64;
    if (audioBase64.includes('base64,')) {
      cleanBase64 = audioBase64.split('base64,')[1];
    }
    
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // We will use native fetch to call our python microservice running on port 8000
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename);

    const aiResponse = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Service Error:', errorText);
      throw new Error(`AI Service returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();

    return res.json({ success: true, result: aiData.result });

  } catch (error: any) {
    console.error('Error analyzing tone:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze audio tone.',
      details: error.stack
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Open-Source Audio Analysis Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
