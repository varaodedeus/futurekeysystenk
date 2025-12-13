# 🔐 AuthGuard - Sistema tipo LuArmor

## 🎉 SISTEMA COMPLETO TIPO LUARMOR!

**O script NUNCA é visível! Fica no servidor!**

---

## 🎯 COMO FUNCIONA:

### 1️⃣ **Admin faz upload do script**
- Obfusca o script (Prometheus ou outro)
- Faz **upload no dashboard**
- Recebe um **SCRIPT_ID** (ex: `ABC12345`)

### 2️⃣ **Admin gera o LOADER**
- Acessa: `https://seu-site.com/loader/ABC12345`
- Copia o código do loader
- Cola no Pastebin

### 3️⃣ **Admin compartilha**
- Link do Pastebin
- Keys do projeto

### 4️⃣ **Usuário usa assim:**
```lua
_G.SCRIPT_KEY = "AGRD-1234-5678-9ABC"
loadstring(game:HttpGet("pastebin.com/raw/xyz"))()
```

### 5️⃣ **O que acontece:**
1. Loader valida a key no servidor
2. Se válida, **BAIXA o script** do servidor
3. **EXECUTA** o script
4. Script **NUNCA é visível** na URL ou código

---

## 📋 EXEMPLO COMPLETO:

### **Passo 1: Admin obfusca script**
```lua
-- script-original.lua
print("Hello World!")
print("Meu script secreto!")
```

Ofusca com Prometheus → gera `script-obfuscado.lua`

### **Passo 2: Upload no dashboard**
```javascript
// No dashboard
POST /api/upload-script
{
  "projectId": "67a45b...",
  "scriptContent": "código obfuscado aqui",
  "scriptName": "Meu Script v1.0"
}

// Resposta:
{
  "success": true,
  "scriptId": "XYZ789AB"
}
```

### **Passo 3: Pegar o loader**
```
https://seu-site.com/loader/XYZ789AB
```

Retorna:
```lua
-- AuthGuard Loader
_G.SCRIPT_KEY = "SUA-KEY-AQUI" -- MUDE AQUI!

local SCRIPT_ID = "XYZ789AB"
local API_URL = "https://seu-site.com/api/execute-script"

-- código de validação...
```

### **Passo 4: Usuário final**
```lua
_G.SCRIPT_KEY = "AGRD-1234-5678-9ABC"
loadstring(game:HttpGet("pastebin.com/raw/loader"))()
```

**Resultado:**
- ✅ Key validada
- ✅ Script baixado do servidor
- ✅ Script executado
- ❌ Código NUNCA visível

---

## 🔒 SEGURANÇA:

### **Por que é seguro?**

1. **Script fica no banco** - Não dá pra ver
2. **Só executa com key válida** - Protegido
3. **HWID binding** - Uma key = um PC
4. **Loader não mostra código** - Só executa
5. **Impossível copiar** - Tá no servidor

### **Diferença do sistema antigo:**

**ANTES:**
```
/loader/1234 → Retorna código completo (dá pra copiar)
```

**AGORA:**
```
/loader/ABC123 → Retorna LOADER (não mostra script)
Script só vem se key for válida
```

---

## 📊 FLUXO COMPLETO:

```
┌─────────────┐
│   ADMIN     │
└──────┬──────┘
       │
       ├─ 1. Obfusca script
       ├─ 2. Upload (POST /api/upload-script)
       ├─ 3. Recebe SCRIPT_ID
       ├─ 4. Pega loader (GET /loader/SCRIPT_ID)
       ├─ 5. Cola no Pastebin
       └─ 6. Compartilha link + keys
       
┌─────────────┐
│   USUÁRIO   │
└──────┬──────┘
       │
       ├─ 1. Copia loader do Pastebin
       ├─ 2. Seta _G.SCRIPT_KEY = "key comprada"
       ├─ 3. Executa loadstring
       │
       ├─ 4. Loader valida key (POST /api/execute-script)
       │    ├─ Key inválida? → ERRO
       │    └─ Key válida? → Retorna script
       │
       └─ 5. loadstring(script retornado)()
              └─ SCRIPT EXECUTA! ✅
```

---

## 🎨 DASHBOARD - NOVA SEÇÃO:

Adiciona no dashboard:

### **Upload Script**
```html
<button onclick="showUploadModal()">📤 Upload Script</button>

<div id="scriptsList">
  <!-- Lista de scripts enviados -->
  <div class="script-card">
    <h4>Meu Script v1.0</h4>
    <p>ID: XYZ789AB</p>
    <p>Execuções: 1,234</p>
    <button onclick="getLoader('XYZ789AB')">📋 Ver Loader</button>
    <button onclick="deleteScript('XYZ789AB')">🗑️ Deletar</button>
  </div>
</div>
```

---

## 🚀 ENDPOINTS:

### **POST /api/upload-script**
Upload de script obfuscado
```json
{
  "projectId": "67a45b...",
  "scriptContent": "código obfuscado",
  "scriptName": "Nome do script"
}
```

### **GET /api/list-scripts?projectId=...**
Lista scripts do projeto

### **DELETE /api/delete-script**
Deleta script
```json
{
  "scriptId": "XYZ789AB"
}
```

### **POST /api/execute-script** (PÚBLICO)
Valida key e retorna script
```json
{
  "scriptId": "XYZ789AB",
  "key": "AGRD-1234-5678",
  "hwid": "hardware-id"
}
```

### **GET /loader/:scriptId**
Retorna código do loader

---

## 💪 VANTAGENS:

✅ **Script protegido** - Fica no servidor  
✅ **Impossível copiar** - Nunca é visível  
✅ **Key obrigatória** - Sem key = sem script  
✅ **HWID binding** - Uma key = um PC  
✅ **Estatísticas** - Quantas vezes executou  
✅ **Tipo LuArmor** - Mesma segurança!  

---

## ⚠️ IMPORTANTE:

1. **Obfusque o script ANTES** de fazer upload
2. **Nunca** compartilhe o scriptId sem proteção
3. **Loader** pode ser público (não mostra script)
4. **Script** só vem se key for válida

---

## 🎯 RESUMO:

**Sistema antigo:**
- Código na URL → Dá pra copiar ❌

**Sistema novo (tipo LuArmor):**
- Script no banco → Impossível copiar ✅
- Só executa com key válida ✅
- HWID binding ✅
- Proteção MÁXIMA! ✅

---

**DEPLOY E TESTA!** 🚀💪
