/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeSammy, synthesizeSpeech } from './src/server/sammyEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Endpoint de Sammy
app.post('/api/sammy', async (req, res) => {
  try {
    const result = await executeSammy(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    const errMsg = String(error?.message || '');
    const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');
    if (isQuota) {
      const quotaNotice = "Che, alcanzamos el límite de la cuota gratuita diaria de consultas de Gemini para este proyecto. El resto del portal (turnos, nómina, tareas, francos y caja) sigue funcionando normalmente.";
      return res.status(200).json({
        ok: true,
        text: quotaNotice,
        respuesta: quotaNotice,
        toolCalls: [],
        responseId: 'quota_limit'
      });
    }
    console.error('SAMMY SERVER ERROR:', error);
    return res.status(500).json({
      ok: false,
      error: errMsg || 'Error interno procesando con Sammy.'
    });
  }
});

// Endpoint de voz TTS de Sammy
app.post('/api/sammy/tts', async (req, res) => {
  try {
    const text = req.body?.text || '';
    if (!text) {
      return res.status(200).json({ ok: false, useClientTTS: true });
    }
    const result = await synthesizeSpeech(text);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(200).json({ ok: false, useClientTTS: true });
  }
});

// Ruta principal y directa al Portal Corporativo / RR.HH.
app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'portal.html'));
});

app.get('/portal', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'portal.html'));
});

app.get('/studio', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.use(express.static(path.resolve(__dirname, 'public')));

// En desarrollo, montamos Vite middlewares
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  // En producción, servimos el build estático de Vite
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
