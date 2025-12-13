# 🔐 AuthGuard - Sistema LuArmor Style

Sistema completo de gerenciamento de licenças tipo **LuArmor**!

---

## ✨ FEATURES:

- ✅ **Upload de scripts** (ficam no servidor, nunca visíveis)
- ✅ **Sistema de keys** com HWID binding
- ✅ **Loader executável** (não mostra código)
- ✅ **Dashboard moderno** com abas (Projetos, Scripts, Keys)
- ✅ **MongoDB hardcoded** (zero configuração)
- ✅ **Prometheus integration** (opcional)

---

## 🚀 DEPLOY RAILWAY:

1. **GitHub já conectado!** (esse repo)
2. Vai no Railway: https://railway.app
3. New Project → Deploy from GitHub repo
4. Seleciona este repositório
5. Generate Domain
6. **PRONTO!**

---

## 💡 COMO USA:

### **Admin:**

1. Cria projeto no dashboard
2. Faz upload do script (já ofuscado)
3. Recebe um **SCRIPT_ID**
4. Clica em "Ver Loader" e copia
5. Cola no Pastebin
6. Gera keys
7. Compartilha link + keys

### **Usuário:**

```lua
_G.SCRIPT_KEY = "AGRD-1234-5678-9ABC"
loadstring(game:HttpGet("pastebin.com/raw/loader"))()
```

**O que acontece:**
1. Loader valida a key
2. Se válida, BAIXA o script do servidor
3. EXECUTA (nunca mostra o código)

---

## 🔒 SEGURANÇA:

- Script fica no MongoDB (nunca visível)
- Só executa com key válida
- HWID binding automático
- **IMPOSSÍVEL copiar o código!**

---

## 📂 ESTRUTURA:

```
/routes
  /auth.js       - Login/Registro
  /projects.js   - CRUD projetos
  /keys.js       - Sistema de keys
  /scripts.js    - Upload/Execute scripts

/public
  /login.html       - Tela de login
  /register.html    - Tela de registro  
  /dashboard.html   - Dashboard tipo LuArmor
  /dashboard-atualizado.js - JavaScript

/server.js - Express + Loader endpoint
/Dockerfile - Para Railway
```

---

## 🎯 ENDPOINTS:

- `POST /api/upload-script` - Upload de script
- `GET /api/list-scripts` - Listar scripts
- `DELETE /api/delete-script` - Deletar script
- `POST /api/execute-script` - Executar (valida key)
- `GET /loader/:scriptId` - Pegar loader

---

## 💪 VANTAGENS:

✅ **Tipo LuArmor** - Mesmo sistema  
✅ **Script protegido** - Fica no servidor  
✅ **Impossível copiar** - Nunca visível  
✅ **HWID binding** - Uma key = um PC  
✅ **Dashboard moderno** - UI foda  
✅ **MongoDB hardcoded** - Zero config  

---

**DESENVOLVIDO COM ❤️ E MUITO CAFÉ ☕**
