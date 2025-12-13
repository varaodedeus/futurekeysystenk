-- AuthGuard Loader
-- Sistema de Validação de Keys

-- ==========================================
-- CONFIGURAÇÃO DO USUÁRIO
-- ==========================================

_G.SCRIPT_KEY = "SUA-KEY-AQUI" -- MUDE AQUI!

_G.YOUR_SCRIPT = [[
-- ==========================================
-- COLE SEU SCRIPT AQUI
-- ==========================================

print("🎮 Meu script está executando!")
print("✅ Key validada com sucesso!")

-- Seu código aqui...
local player = game.Players.LocalPlayer
print("Olá, " .. player.Name .. "!")

-- ==========================================
]]

-- ==========================================
-- NÃO MEXA ABAIXO DESTA LINHA
-- ==========================================

local HttpService = game:GetService("HttpService")
local API_URL = "SEU-DOMINIO-AQUI/api/validate-key-simple"

local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return success and hwid or "HWID_ERROR"
end

local function validateAndExecute()
    local key = _G.SCRIPT_KEY
    local script = _G.YOUR_SCRIPT
    
    if not key or key == "SUA-KEY-AQUI" then
        error("❌ Configure _G.SCRIPT_KEY antes de executar!")
        return
    end
    
    if not script or script == "" then
        error("❌ Configure _G.YOUR_SCRIPT antes de executar!")
        return
    end
    
    print("🔐 AuthGuard - Validando licença...")
    
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
        print("✅ Licença válida! Executando seu script...")
        
        -- EXECUTA O SCRIPT DO USUÁRIO
        local scriptFunc = loadstring(script)
        if scriptFunc then
            scriptFunc()
        else
            error("❌ Erro ao carregar seu script")
        end
    else
        local errorMsg = response and response.error or "Erro de conexão"
        error("❌ " .. errorMsg)
    end
end

validateAndExecute()
