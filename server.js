import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Rotas
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import keyRoutes from './routes/keys.js';
import scriptRoutes from './routes/scripts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Cache para códigos
const loaderCache = new Map();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', projectRoutes);
app.use('/api', keyRoutes);
app.use('/api', scriptRoutes);

// Rotas das páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Loader endpoint - retorna o código Lua
app.get('/loader/:scriptId', (req, res) => {
  const { scriptId } = req.params;
  const API_URL = `${req.protocol}://${req.get('host')}`;
  
  // Verifica cache
  if (loaderCache.has(scriptId)) {
    console.log(`📦 Cache hit para script ${scriptId}`);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(loaderCache.get(scriptId));
  }
  
  console.log(`🔨 Gerando loader para script ${scriptId}`);
  
  // Código Lua do loader
  const loaderCode = `
-- AuthGuard Loader
-- Script ID: ${scriptId}

-- CONFIGURAÇÃO
_G.SCRIPT_KEY = "SUA-KEY-AQUI" -- MUDE AQUI!

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

local SCRIPT_ID = "${scriptId}"
local API_URL = "${API_URL}/api/execute-script"

-- Obter HWID
local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return success and hwid or "HWID_ERROR"
end

-- Validar e executar
local function validateAndExecute()
    local key = _G.SCRIPT_KEY
    
    if not key or key == "SUA-KEY-AQUI" then
        error("❌ Configure _G.SCRIPT_KEY antes de executar!")
        return
    end
    
    print("🔐 AuthGuard - Validando licença...")
    
    local hwid = getHWID()
    
    local success, response = pcall(function()
        local jsonRequest = HttpService:JSONEncode({
            scriptId = SCRIPT_ID,
            key = key,
            hwid = hwid
        })
        
        local jsonResponse = HttpService:PostAsync(
            API_URL,
            jsonRequest,
            Enum.HttpContentType.ApplicationJson,
            false
        )
        
        return HttpService:JSONDecode(jsonResponse)
    end)
    
    if success and response.success then
        print("✅ Licença válida! Executando script...")
        
        -- EXECUTA O SCRIPT (que veio do servidor)
        local scriptFunc = loadstring(response.script)
        if scriptFunc then
            scriptFunc()
        else
            error("❌ Erro ao carregar script")
        end
    else
        local errorMsg = response and response.error or "Erro de conexão"
        error("❌ " .. errorMsg)
    end
end

-- Executa
validateAndExecute()
`;

  // Salvar no cache
  loaderCache.set(scriptId, loaderCode);
  
  console.log(`✅ Loader gerado! Tamanho: ${loaderCode.length} bytes`);
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(loaderCode);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    loaderCacheSize: loaderCache.size
  });
});

// Limpar cache (endpoint admin)
app.post('/admin/clear-cache', (req, res) => {
  const { secret } = req.body;
  if (secret === 'authguard_secret_2024') {
    loaderCache.clear();
    res.json({ success: true, message: 'Cache limpo!' });
  } else {
    res.status(401).json({ success: false, error: 'Não autorizado' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuthGuard rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
