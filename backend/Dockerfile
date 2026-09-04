# Usamos la imagen estándar de Node 20 (mucho más estable que alpine para Windows)
FROM node:20

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos solo los archivos de dependencias primero
COPY package*.json ./

# Instalamos las dependencias (ahora no se debería congelar)
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]