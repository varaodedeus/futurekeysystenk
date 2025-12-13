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

// Cache para loaders
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

// LOADER COM UI - Admin copia e cola seu script
app.get('/loader/:projectId', (req, res) => {
  const { projectId } = req.params;
  const API_URL = `${req.protocol}://${req.get('host')}`;
  
  console.log(`🔨 Gerando loader UI para projeto ${projectId}`);
  
  const loaderCode = `-- ============================================
-- AuthGuard - License Validation System
-- Projeto ID: ${projectId}
-- ============================================

-- ==========================================
-- ⚠️ INPUT YOUR SCRIPT HERE ⚠️
-- ==========================================
local YOUR_SCRIPT = [[

-- COLE SEU SCRIPT AQUI ADMIN!
print("Meu script executando!")

]]
-- ==========================================
-- ⚠️ DON'T EDIT BELOW THIS LINE ⚠️
-- ==========================================

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local API_URL = "${API_URL}/api/validate-key-simple"

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "AuthGuardUI"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

if LocalPlayer.PlayerGui:FindFirstChild("AuthGuardUI") then
    LocalPlayer.PlayerGui:FindFirstChild("AuthGuardUI"):Destroy()
end

ScreenGui.Parent = LocalPlayer.PlayerGui

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 400, 0, 250)
MainFrame.Position = UDim2.new(0.5, -200, 0.5, -125)
MainFrame.BackgroundColor3 = Color3.fromRGB(20, 25, 35)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = ScreenGui

local Corner = Instance.new("UICorner")
Corner.CornerRadius = UDim.new(0, 12)
Corner.Parent = MainFrame

local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, 0, 0, 50)
Title.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
Title.BorderSizePixel = 0
Title.Text = "🔐 AuthGuard"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 24
Title.Font = Enum.Font.GothamBold
Title.Parent = MainFrame

local TitleCorner = Instance.new("UICorner")
TitleCorner.CornerRadius = UDim.new(0, 12)
TitleCorner.Parent = Title

local Subtitle = Instance.new("TextLabel")
Subtitle.Size = UDim2.new(1, -40, 0, 20)
Subtitle.Position = UDim2.new(0, 20, 0, 60)
Subtitle.BackgroundTransparency = 1
Subtitle.Text = "Enter your license key"
Subtitle.TextColor3 = Color3.fromRGB(148, 163, 184)
Subtitle.TextSize = 14
Subtitle.Font = Enum.Font.Gotham
Subtitle.TextXAlignment = Enum.TextXAlignment.Left
Subtitle.Parent = MainFrame

local KeyInput = Instance.new("TextBox")
KeyInput.Size = UDim2.new(1, -40, 0, 45)
KeyInput.Position = UDim2.new(0, 20, 0, 90)
KeyInput.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
KeyInput.BorderSizePixel = 0
KeyInput.PlaceholderText = "AGRD-XXXX-XXXX-XXXX"
KeyInput.PlaceholderColor3 = Color3.fromRGB(100, 116, 139)
KeyInput.Text = ""
KeyInput.TextColor3 = Color3.fromRGB(255, 255, 255)
KeyInput.TextSize = 16
KeyInput.Font = Enum.Font.GothamMedium
KeyInput.ClearTextOnFocus = false
KeyInput.Parent = MainFrame

local KeyInputCorner = Instance.new("UICorner")
KeyInputCorner.CornerRadius = UDim.new(0, 8)
KeyInputCorner.Parent = KeyInput

local ExecuteButton = Instance.new("TextButton")
ExecuteButton.Size = UDim2.new(1, -40, 0, 45)
ExecuteButton.Position = UDim2.new(0, 20, 0, 150)
ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
ExecuteButton.BorderSizePixel = 0
ExecuteButton.Text = "🚀 VALIDATE & EXECUTE"
ExecuteButton.TextColor3 = Color3.fromRGB(255, 255, 255)
ExecuteButton.TextSize = 16
ExecuteButton.Font = Enum.Font.GothamBold
ExecuteButton.AutoButtonColor = false
ExecuteButton.Parent = MainFrame

local ExecuteButtonCorner = Instance.new("UICorner")
ExecuteButtonCorner.CornerRadius = UDim.new(0, 10)
ExecuteButtonCorner.Parent = ExecuteButton

local StatusLabel = Instance.new("TextLabel")
StatusLabel.Size = UDim2.new(1, -40, 0, 20)
StatusLabel.Position = UDim2.new(0, 20, 0, 210)
StatusLabel.BackgroundTransparency = 1
StatusLabel.Text = ""
StatusLabel.TextColor3 = Color3.fromRGB(148, 163, 184)
StatusLabel.TextSize = 12
StatusLabel.Font = Enum.Font.Gotham
StatusLabel.Parent = MainFrame

local CloseButton = Instance.new("TextButton")
CloseButton.Size = UDim2.new(0, 30, 0, 30)
CloseButton.Position = UDim2.new(1, -40, 0, 10)
CloseButton.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
CloseButton.BorderSizePixel = 0
CloseButton.Text = "✕"
CloseButton.TextColor3 = Color3.fromRGB(255, 255, 255)
CloseButton.TextSize = 18
CloseButton.Font = Enum.Font.GothamBold
CloseButton.Parent = MainFrame

local CloseButtonCorner = Instance.new("UICorner")
CloseButtonCorner.CornerRadius = UDim.new(0, 8)
CloseButtonCorner.Parent = CloseButton

local dragging, dragInput, dragStart, startPos

local function update(input)
    local delta = input.Position - dragStart
    MainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
end

Title.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        dragStart = input.Position
        startPos = MainFrame.Position
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                dragging = false
            end
        end)
    end
end)

Title.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
        dragInput = input
    end
end)

game:GetService("UserInputService").InputChanged:Connect(function(input)
    if input == dragInput and dragging then
        update(input)
    end
end)

local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return success and hwid or "HWID_ERROR"
end

local function notify(text, color)
    StatusLabel.Text = text
    StatusLabel.TextColor3 = color or Color3.fromRGB(148, 163, 184)
end

local function validateAndExecute()
    local key = KeyInput.Text
    
    if key == "" or key == "AGRD-XXXX-XXXX-XXXX" then
        notify("❌ Enter your license key!", Color3.fromRGB(239, 68, 68))
        return
    end
    
    notify("🔐 Validating license...", Color3.fromRGB(245, 158, 11))
    ExecuteButton.BackgroundColor3 = Color3.fromRGB(100, 116, 139)
    ExecuteButton.Text = "⏳ VALIDATING..."
    
    local hwid = getHWID()
    
    local success, response = pcall(function()
        local jsonRequest = HttpService:JSONEncode({
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
        notify("✅ License valid! Executing...", Color3.fromRGB(16, 185, 129))
        ExecuteButton.BackgroundColor3 = Color3.fromRGB(16, 185, 129)
        ExecuteButton.Text = "✅ EXECUTING..."
        
        wait(0.5)
        
        local scriptFunc = loadstring(YOUR_SCRIPT)
        if scriptFunc then
            scriptFunc()
            notify("✅ Script executed!", Color3.fromRGB(16, 185, 129))
            wait(2)
            ScreenGui:Destroy()
        else
            notify("❌ Script error!", Color3.fromRGB(239, 68, 68))
            ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
            ExecuteButton.Text = "🚀 VALIDATE & EXECUTE"
        end
    else
        local errorMsg = response and response.error or "Connection error"
        notify("❌ " .. errorMsg, Color3.fromRGB(239, 68, 68))
        ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
        ExecuteButton.Text = "🚀 VALIDATE & EXECUTE"
    end
end

ExecuteButton.MouseButton1Click:Connect(validateAndExecute)
CloseButton.MouseButton1Click:Connect(function() ScreenGui:Destroy() end)

ExecuteButton.MouseEnter:Connect(function()
    if ExecuteButton.Text == "🚀 VALIDATE & EXECUTE" then
        ExecuteButton.BackgroundColor3 = Color3.fromRGB(56, 189, 248)
    end
end)

ExecuteButton.MouseLeave:Connect(function()
    if ExecuteButton.Text == "🚀 VALIDATE & EXECUTE" then
        ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
    end
end)

CloseButton.MouseEnter:Connect(function()
    CloseButton.BackgroundColor3 = Color3.fromRGB(220, 38, 38)
end)

CloseButton.MouseLeave:Connect(function()
    CloseButton.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
end)

print("🔐 AuthGuard loaded! Enter your license key.")
`;
  
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

// Limpar cache
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
