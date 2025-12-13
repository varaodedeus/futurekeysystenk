FROM node:18

# Configura diretório do app
WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código do app
COPY . .

# Expõe porta
EXPOSE 3000

# Start
CMD ["npm", "start"]
