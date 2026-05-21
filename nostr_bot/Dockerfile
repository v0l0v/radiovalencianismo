FROM node:20-alpine

# Crear directorio de la app
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (solo las de producción)
RUN npm ci --only=production

# Copiar el código fuente
COPY index.js .

# Comando por defecto al iniciar el contenedor
CMD [ "node", "index.js" ]
