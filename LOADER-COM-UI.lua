-- AuthGuard Loader - COM UI
-- by AuthGuard System

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

local API_URL = "SEU-DOMINIO-AQUI/api/validate-key-simple"

-- Criar ScreenGui
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "AuthGuardUI"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

-- Verificar se já existe
if LocalPlayer.PlayerGui:FindFirstChild("AuthGuardUI") then
    LocalPlayer.PlayerGui:FindFirstChild("AuthGuardUI"):Destroy()
end

ScreenGui.Parent = LocalPlayer.PlayerGui

-- Frame Principal
local MainFrame = Instance.new("Frame")
MainFrame.Name = "MainFrame"
MainFrame.Size = UDim2.new(0, 500, 0, 400)
MainFrame.Position = UDim2.new(0.5, -250, 0.5, -200)
MainFrame.BackgroundColor3 = Color3.fromRGB(20, 25, 35)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = ScreenGui

-- Corner
local Corner = Instance.new("UICorner")
Corner.CornerRadius = UDim.new(0, 12)
Corner.Parent = MainFrame

-- Sombra
local Shadow = Instance.new("ImageLabel")
Shadow.Name = "Shadow"
Shadow.Size = UDim2.new(1, 30, 1, 30)
Shadow.Position = UDim2.new(0, -15, 0, -15)
Shadow.BackgroundTransparency = 1
Shadow.Image = "rbxasset://textures/ui/GuiImagePlaceholder.png"
Shadow.ImageColor3 = Color3.fromRGB(0, 0, 0)
Shadow.ImageTransparency = 0.5
Shadow.ScaleType = Enum.ScaleType.Slice
Shadow.SliceCenter = Rect.new(10, 10, 10, 10)
Shadow.ZIndex = 0
Shadow.Parent = MainFrame

-- Título
local Title = Instance.new("TextLabel")
Title.Name = "Title"
Title.Size = UDim2.new(1, 0, 0, 50)
Title.Position = UDim2.new(0, 0, 0, 0)
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

-- Subtitle
local Subtitle = Instance.new("TextLabel")
Subtitle.Name = "Subtitle"
Subtitle.Size = UDim2.new(1, -40, 0, 20)
Subtitle.Position = UDim2.new(0, 20, 0, 60)
Subtitle.BackgroundTransparency = 1
Subtitle.Text = "License Validation System"
Subtitle.TextColor3 = Color3.fromRGB(148, 163, 184)
Subtitle.TextSize = 14
Subtitle.Font = Enum.Font.Gotham
Subtitle.TextXAlignment = Enum.TextXAlignment.Left
Subtitle.Parent = MainFrame

-- Label Key
local KeyLabel = Instance.new("TextLabel")
KeyLabel.Name = "KeyLabel"
KeyLabel.Size = UDim2.new(1, -40, 0, 20)
KeyLabel.Position = UDim2.new(0, 20, 0, 90)
KeyLabel.BackgroundTransparency = 1
KeyLabel.Text = "LICENSE KEY:"
KeyLabel.TextColor3 = Color3.fromRGB(241, 245, 249)
KeyLabel.TextSize = 12
KeyLabel.Font = Enum.Font.GothamBold
KeyLabel.TextXAlignment = Enum.TextXAlignment.Left
KeyLabel.Parent = MainFrame

-- Input Key
local KeyInput = Instance.new("TextBox")
KeyInput.Name = "KeyInput"
KeyInput.Size = UDim2.new(1, -40, 0, 40)
KeyInput.Position = UDim2.new(0, 20, 0, 115)
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

-- Label Script
local ScriptLabel = Instance.new("TextLabel")
ScriptLabel.Name = "ScriptLabel"
ScriptLabel.Size = UDim2.new(1, -40, 0, 20)
ScriptLabel.Position = UDim2.new(0, 20, 0, 170)
ScriptLabel.BackgroundTransparency = 1
ScriptLabel.Text = "YOUR SCRIPT:"
ScriptLabel.TextColor3 = Color3.fromRGB(241, 245, 249)
ScriptLabel.TextSize = 12
ScriptLabel.Font = Enum.Font.GothamBold
ScriptLabel.TextXAlignment = Enum.TextXAlignment.Left
ScriptLabel.Parent = MainFrame

-- Input Script
local ScriptInput = Instance.new("TextBox")
ScriptInput.Name = "ScriptInput"
ScriptInput.Size = UDim2.new(1, -40, 0, 120)
ScriptInput.Position = UDim2.new(0, 20, 0, 195)
ScriptInput.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
ScriptInput.BorderSizePixel = 0
ScriptInput.PlaceholderText = "-- Paste your script here...\nprint('Hello World!')"
ScriptInput.PlaceholderColor3 = Color3.fromRGB(100, 116, 139)
ScriptInput.Text = ""
ScriptInput.TextColor3 = Color3.fromRGB(16, 185, 129)
ScriptInput.TextSize = 14
ScriptInput.Font = Enum.Font.Code
ScriptInput.TextXAlignment = Enum.TextXAlignment.Left
ScriptInput.TextYAlignment = Enum.TextYAlignment.Top
ScriptInput.MultiLine = true
ScriptInput.ClearTextOnFocus = false
ScriptInput.TextWrapped = true
ScriptInput.Parent = MainFrame

local ScriptInputCorner = Instance.new("UICorner")
ScriptInputCorner.CornerRadius = UDim.new(0, 8)
ScriptInputCorner.Parent = ScriptInput

-- Botão Execute
local ExecuteButton = Instance.new("TextButton")
ExecuteButton.Name = "ExecuteButton"
ExecuteButton.Size = UDim2.new(1, -40, 0, 45)
ExecuteButton.Position = UDim2.new(0, 20, 0, 330)
ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
ExecuteButton.BorderSizePixel = 0
ExecuteButton.Text = "🚀 EXECUTE"
ExecuteButton.TextColor3 = Color3.fromRGB(255, 255, 255)
ExecuteButton.TextSize = 16
ExecuteButton.Font = Enum.Font.GothamBold
ExecuteButton.AutoButtonColor = false
ExecuteButton.Parent = MainFrame

local ExecuteButtonCorner = Instance.new("UICorner")
ExecuteButtonCorner.CornerRadius = UDim.new(0, 10)
ExecuteButtonCorner.Parent = ExecuteButton

-- Status Label
local StatusLabel = Instance.new("TextLabel")
StatusLabel.Name = "StatusLabel"
StatusLabel.Size = UDim2.new(1, -40, 0, 15)
StatusLabel.Position = UDim2.new(0, 20, 1, -25)
StatusLabel.BackgroundTransparency = 1
StatusLabel.Text = ""
StatusLabel.TextColor3 = Color3.fromRGB(148, 163, 184)
StatusLabel.TextSize = 11
StatusLabel.Font = Enum.Font.Gotham
StatusLabel.Parent = MainFrame

-- Botão Fechar
local CloseButton = Instance.new("TextButton")
CloseButton.Name = "CloseButton"
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

-- Draggable
local dragging
local dragInput
local dragStart
local startPos

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

-- Função HWID
local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return success and hwid or "HWID_ERROR"
end

-- Função de notificação
local function notify(text, color)
    StatusLabel.Text = text
    StatusLabel.TextColor3 = color or Color3.fromRGB(148, 163, 184)
end

-- Função de validação e execução
local function validateAndExecute()
    local key = KeyInput.Text
    local script = ScriptInput.Text
    
    if key == "" or key == "AGRD-XXXX-XXXX-XXXX" then
        notify("❌ Enter your license key!", Color3.fromRGB(239, 68, 68))
        return
    end
    
    if script == "" then
        notify("❌ Paste your script!", Color3.fromRGB(239, 68, 68))
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
        
        -- EXECUTA O SCRIPT
        local scriptFunc = loadstring(script)
        if scriptFunc then
            scriptFunc()
            notify("✅ Script executed successfully!", Color3.fromRGB(16, 185, 129))
            
            -- Fecha UI após 2 segundos
            wait(2)
            ScreenGui:Destroy()
        else
            notify("❌ Invalid script syntax!", Color3.fromRGB(239, 68, 68))
            ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
            ExecuteButton.Text = "🚀 EXECUTE"
        end
    else
        local errorMsg = response and response.error or "Connection error"
        notify("❌ " .. errorMsg, Color3.fromRGB(239, 68, 68))
        ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
        ExecuteButton.Text = "🚀 EXECUTE"
    end
end

-- Eventos
ExecuteButton.MouseButton1Click:Connect(validateAndExecute)

CloseButton.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
end)

-- Hover effect Execute Button
ExecuteButton.MouseEnter:Connect(function()
    ExecuteButton.BackgroundColor3 = Color3.fromRGB(56, 189, 248)
end)

ExecuteButton.MouseLeave:Connect(function()
    if ExecuteButton.Text == "🚀 EXECUTE" then
        ExecuteButton.BackgroundColor3 = Color3.fromRGB(14, 165, 233)
    end
end)

-- Hover effect Close Button
CloseButton.MouseEnter:Connect(function()
    CloseButton.BackgroundColor3 = Color3.fromRGB(220, 38, 38)
end)

CloseButton.MouseLeave:Connect(function()
    CloseButton.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
end)

print("🔐 AuthGuard UI loaded! Enter your key and script.")
