import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import PrometheusObfuscator from './prometheus-integration.js';

// Rotas
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import keyRoutes from './routes/keys.js';
import scriptRoutes from './routes/scripts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Cache para códigos obfuscados
const obfuscatorCache = new Map();

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

// Loader endpoint - retorna o código Lua OBFUSCADO COM PROMETHEUS
app.get('/loader/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const API_URL = `${req.protocol}://${req.get('host')}`;
  
  // Verifica cache
  if (obfuscatorCache.has(projectId)) {
    console.log(`📦 Cache hit para projeto ${projectId}`);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(obfuscatorCache.get(projectId));
  }
  
  console.log(`🔨 Gerando código obfuscado com PROMETHEUS para projeto ${projectId}`);
  
  // Código Lua original (limpo)
  const luaCode = `
-- AuthGuard Library
-- Project ID: ${projectId}

local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

local AuthGuard = {}
AuthGuard.ProjectId = "${projectId}"
AuthGuard.ApiUrl = "${API_URL}/api/validate-key"

-- UI de validação
local function createUI()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "AuthGuardUI"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    pcall(function() screenGui.Parent = game:GetService("CoreGui") end)
    if not screenGui.Parent then screenGui.Parent = LocalPlayer.PlayerGui end
    
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, 0, 1, 0)
    bg.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    bg.BackgroundTransparency = 0.3
    bg.BorderSizePixel = 0
    bg.Parent = screenGui
    
    local container = Instance.new("Frame")
    container.Size = UDim2.new(0, 450, 0, 300)
    container.Position = UDim2.new(0.5, -225, 0.5, -150)
    container.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
    container.BorderSizePixel = 0
    container.Parent = screenGui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 20)
    corner.Parent = container
    
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, -40, 0, 50)
    title.Position = UDim2.new(0, 20, 0, 20)
    title.BackgroundTransparency = 1
    title.Text = "🔐 AuthGuard"
    title.TextColor3 = Color3.fromRGB(14, 165, 233)
    title.TextSize = 32
    title.Font = Enum.Font.GothamBold
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = container
    
    local subtitle = Instance.new("TextLabel")
    subtitle.Size = UDim2.new(1, -40, 0, 30)
    subtitle.Position = UDim2.new(0, 20, 0, 70)
    subtitle.BackgroundTransparency = 1
    subtitle.Text = "Cole sua licença abaixo:"
    subtitle.TextColor3 = Color3.fromRGB(148, 163, 184)
    subtitle.TextSize = 16
    subtitle.Font = Enum.Font.Gotham
    subtitle.TextXAlignment = Enum.TextXAlignment.Left
    subtitle.Parent = container
    
    local inputBg = Instance.new("Frame")
    inputBg.Size = UDim2.new(1, -40, 0, 50)
    inputBg.Position = UDim2.new(0, 20, 0, 110)
    inputBg.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    inputBg.BorderSizePixel = 0
    inputBg.Parent = container
    
    local inputCorner = Instance.new("UICorner")
    inputCorner.CornerRadius = UDim.new(0, 12)
    inputCorner.Parent = inputBg
    
    local input = Instance.new("TextBox")
    input.Size = UDim2.new(1, -20, 1, 0)
    input.Position = UDim2.new(0, 10, 0, 0)
    input.BackgroundTransparency = 1
    input.Text = ""
    input.PlaceholderText = "AGRD-XXXX-XXXX-XXXX"
    input.TextColor3 = Color3.fromRGB(241, 245, 249)
    input.PlaceholderColor3 = Color3.fromRGB(100, 116, 139)
    input.TextSize = 18
    input.Font = Enum.Font.GothamMedium
    input.ClearTextOnFocus = false
    input.Parent = inputBg
    
    local button = Instance.new("TextButton")
    button.Size = UDim2.new(1, -40, 0, 50)
    button.Position = UDim2.new(0, 20, 0, 180)
    button.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
    button.BorderSizePixel = 0
    button.Text = "Validar Licença"
    button.TextColor3 = Color3.fromRGB(255, 255, 255)
    button.TextSize = 18
    button.Font = Enum.Font.GothamBold
    button.Parent = container
    
    local buttonCorner = Instance.new("UICorner")
    buttonCorner.CornerRadius = UDim.new(0, 12)
    buttonCorner.Parent = button
    
    local status = Instance.new("TextLabel")
    status.Size = UDim2.new(1, -40, 0, 30)
    status.Position = UDim2.new(0, 20, 0, 250)
    status.BackgroundTransparency = 1
    status.Text = ""
    status.TextColor3 = Color3.fromRGB(239, 68, 68)
    status.TextSize = 14
    status.Font = Enum.Font.Gotham
    status.TextXAlignment = Enum.TextXAlignment.Center
    status.Parent = container
    
    return {gui = screenGui, input = input, button = button, status = status}
end

-- Obter HWID
local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return success and hwid or "HWID_ERROR"
end

-- Validar key
function AuthGuard.validate(key, callback)
    local hwid = getHWID()
    local success, response = pcall(function()
        local jsonRequest = HttpService:JSONEncode({
            key = key,
            hwid = hwid,
            projectId = AuthGuard.ProjectId
        })
        local jsonResponse = HttpService:PostAsync(
            AuthGuard.ApiUrl,
            jsonRequest,
            Enum.HttpContentType.ApplicationJson,
            false
        )
        return HttpService:JSONDecode(jsonResponse)
    end)
    
    if success and response.success then
        callback(true, response)
    else
        callback(false, response and response.error or "Erro de conexão")
    end
end

-- Inicializar
function AuthGuard.init(onSuccess)
    local ui = createUI()
    
    ui.button.MouseButton1Click:Connect(function()
        local key = ui.input.Text
        if key == "" or #key < 10 then
            ui.status.Text = "❌ Key inválida"
            ui.status.TextColor3 = Color3.fromRGB(239, 68, 68)
            return
        end
        
        ui.button.Text = "Validando..."
        ui.button.BackgroundColor3 = Color3.fromRGB(100, 116, 139)
        ui.status.Text = "⏳ Validando licença..."
        ui.status.TextColor3 = Color3.fromRGB(148, 163, 184)
        
        AuthGuard.validate(key, function(success, data)
            if success then
                ui.status.Text = "✅ Licença válida!"
                ui.status.TextColor3 = Color3.fromRGB(16, 185, 129)
                task.wait(1)
                ui.gui:Destroy()
                onSuccess()
            else
                ui.status.Text = "❌ " .. data
                ui.status.TextColor3 = Color3.fromRGB(239, 68, 68)
                ui.button.Text = "Validar Licença"
                ui.button.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
            end
        end)
    end)
end

return AuthGuard
`;

  try {
    // Criar obfuscador Prometheus
    const obfuscator = new PrometheusObfuscator();
    
    // Ofuscar código com Prometheus (preset Strong)
    const obfuscated = await obfuscator.obfuscateWithPreset(luaCode, 'Strong');
    
    // Salvar no cache
    obfuscatorCache.set(projectId, obfuscated);
    
    console.log(`✅ Código ofuscado com Prometheus! Tamanho: ${obfuscated.length} bytes`);
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(obfuscated);
  } catch (error) {
    console.error('❌ Erro ao ofuscar:', error);
    res.status(500).send('Erro ao gerar código');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    obfuscatorCacheSize: obfuscatorCache.size
  });
});

// Limpar cache (endpoint admin)
app.post('/admin/clear-cache', (req, res) => {
  const { secret } = req.body;
  if (secret === 'authguard_secret_2024') {
    obfuscatorCache.clear();
    res.json({ success: true, message: 'Cache limpo!' });
  } else {
    res.status(401).json({ success: false, error: 'Não autorizado' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuthGuard rodando na porta ${PORT}`);
  console.log(`🔒 Obfuscador ativado!`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// LOADER ENDPOINT - Retorna código que pede key e executa script
app.get('/loader/:scriptId', (req, res) => {
  const { scriptId } = req.params;
  const API_URL = `${req.protocol}://${req.get('host')}`;
  
  // Código do loader (tipo LuArmor)
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

  res.setHeader('Content-Type', 'text/plain');
  res.send(loaderCode);
});
