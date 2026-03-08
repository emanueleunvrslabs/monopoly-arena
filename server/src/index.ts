import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import agentRoutes from './routes/agents';
import matchRoutes from './routes/matches';
import leaderboardRoutes from './routes/leaderboard';
import { setupSockets } from './sockets/index';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.get('/skill.md', (_, res) => {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.sendFile(path.join(__dirname, '../../public/skill.md'));
});

app.use('/api/agents', agentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎲 Monopoly Arena server on port ${PORT}`);
  setupSockets();
});
