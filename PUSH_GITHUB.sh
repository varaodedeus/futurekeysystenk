#!/bin/bash

echo "🔥 FAZENDO PUSH PRO GITHUB..."
echo ""

cd /home/claude/authguard-obf

# Já configurado remote
git branch -M main

echo "📡 Fazendo push..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCESSO! Código no GitHub!"
    echo "🔗 https://github.com/gabrielmaialva33/authguard-system"
    echo ""
    echo "Agora vai no Railway:"
    echo "1. https://railway.app"
    echo "2. New Project → Deploy from GitHub"
    echo "3. Seleciona 'authguard-system'"
    echo "4. Generate Domain"
    echo "5. PRONTO!"
else
    echo ""
    echo "❌ Erro ao fazer push!"
    echo ""
    echo "Se pedir autenticação, use Personal Access Token:"
    echo "1. https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Marca 'repo'"
    echo "4. Gera o token"
    echo "5. Username: gabrielmaialva33"
    echo "6. Password: COLA_O_TOKEN_AQUI"
fi
