# 🔐 AuthGuard - Sistema Completo (Railway Version)

Sistema completo de gerenciamento de licenças e keys premium para scripts.

## ✨ Funcionalidades Completas

- ✅ Login/Registro com JWT
- ✅ Criar múltiplos projetos
- ✅ Gerar keys premium (AGRD-XXXX-XXXX-XXXX)
- ✅ HWID binding automático
- ✅ Status de keys (ativa, expirada, banida)
- ✅ Expiração configurável (dias ou lifetime)
- ✅ Reset HWID
- ✅ Deletar keys
- ✅ Dashboard completo
- ✅ API de validação pública
- ✅ Logs de tentativas
- ✅ Analytics de uso

## 🚀 Deploy no Railway

### 1. Configure o MongoDB Atlas

1. Acesse: https://cloud.mongodb.com
2. Crie um cluster grátis
3. Database Access → Crie um usuário
4. Network Access → Adicione `0.0.0.0/0`
5. Copie a connection string

### 2. Deploy no Railway

1. Acesse: https://railway.app
2. Login com GitHub
3. **Deploy from GitHub repo**
4. Selecione este repositório
5. Adicione as variáveis de ambiente:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
JWT_SECRET=seu_secret_super_secreto
```

6. Deploy automático! 🎉

### 3. Gere o domínio

1. Settings → Networking → Generate Domain
2. Sua URL: `https://seu-projeto.up.railway.app`

## 📡 API para Scripts Lua

```lua
local HttpService = game:GetService("HttpService")

local API_URL = "https://seu-projeto.up.railway.app/api/validate-key"
local PROJECT_ID = "seu_project_id"

local function getHWID()
    return game:GetService("RbxAnalyticsService"):GetClientId()
end

local function validateKey(key)
    local success, response = pcall(function()
        return HttpService:JSONDecode(
            HttpService:PostAsync(API_URL, HttpService:JSONEncode({
                key = key,
                hwid = getHWID(),
                projectId = PROJECT_ID
            }), Enum.HttpContentType.ApplicationJson)
        )
    end)
    
    if success and response.success then
        print("✅ Key válida!")
        return true
    else
        warn("❌ Key inválida:", response.error or "Erro")
        return false
    end
end

-- Uso
local userKey = "AGRD-XXXX-XXXX-XXXX"
if validateKey(userKey) then
    print("Script autorizado!")
else
    game.Players.LocalPlayer:Kick("Key inválida")
end
```

## 🎯 Endpoints da API

### Autenticação
- `POST /api/login` - Login
- `POST /api/register` - Registro

### Projetos (requer autenticação)
- `POST /api/create-project` - Criar projeto
- `GET /api/list-projects` - Listar projetos

### Keys (requer autenticação)
- `POST /api/generate-key` - Gerar key
- `GET /api/list-keys?projectId=xxx` - Listar keys
- `POST /api/reset-hwid` - Resetar HWID
- `DELETE /api/delete-key` - Deletar key

### Validação (público)
- `POST /api/validate-key` - Validar key

## 📊 Collections do MongoDB

### users
```javascript
{
  username: String,
  email: String,
  password: String, // bcrypt
  createdAt: Date
}
```

### projects
```javascript
{
  userId: ObjectId,
  name: String,
  description: String,
  createdAt: Date,
  stats: { totalKeys, activeKeys, totalValidations }
}
```

### keys
```javascript
{
  projectId: ObjectId,
  userId: ObjectId,
  key: String,
  hwid: String | null,
  duration: Number,
  status: String,
  createdAt: Date,
  expiresAt: Date | null,
  lastUsed: Date,
  usageCount: Number,
  note: String
}
```

### logs
```javascript
{
  projectId: ObjectId,
  keyId: ObjectId,
  key: String,
  hwid: String,
  ip: String,
  action: String,
  reason: String,
  timestamp: Date
}
```

## 💡 Dicas

1. Use senhas fortes no MongoDB
2. Troque o JWT_SECRET
3. Monitore o uso no Railway
4. Verifique logs de validação suspeitas
5. Cada key funciona em apenas um dispositivo (HWID)

## 📝 Licença

MIT - Use livremente!

---

**Sistema 100% funcional e pronto para produção! 🚀**
