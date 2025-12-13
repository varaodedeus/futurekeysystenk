FROM node:18

# Instala .NET SDK para compilar Prometheus
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y dotnet-sdk-7.0 git

# Clona e compila Prometheus
RUN git clone https://github.com/wcrddn/Prometheus.git /prometheus && \
    cd /prometheus && \
    dotnet build -c Release

# Configura diretório do app
WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código do app
COPY . .

# Define PATH do Prometheus
ENV PROMETHEUS_PATH=/prometheus/bin/Release/net7.0/prometheus

# Expõe porta
EXPOSE 3000

# Start
CMD ["npm", "start"]
