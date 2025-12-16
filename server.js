import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import keyRoutes from './routes/keys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('🔥 Registrando rotas...');
app.use('/api', authRoutes);
app.use('/api', projectRoutes);
app.use('/api', keyRoutes);
console.log('✅ Rotas registradas!');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/loader/:projectId', (req, res) => {
  const { projectId } = req.params;
  const API_URL = `${req.protocol}://${req.get('host')}`;
  
  const loaderCode = `-- AuthGuard License System
-- Project ID: ${projectId}

local YOUR_SCRIPT = [[
-- Admin: Cole seu script aqui!
print("Script executando!")
]]

local HttpService = game:GetService("HttpService")
local API_URL = "${API_URL}/api/validate-key"

print("🔐 AuthGuard loaded!")
print("API:", API_URL)
`;
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(loaderCode);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuthGuard rodando na porta ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Validate: http://localhost:${PORT}/api/validate-key`);
});
