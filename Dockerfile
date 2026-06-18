# 1. Usar una imagen base oficial de Node.js (versión 22 LTS, ya que Prisma y Next.js requieren Node.js >= 20.19 / 22.12)
FROM node:22-alpine

# Instalar libc6-compat para compatibilidad con librerías nativas en alpine (necesario para Next.js y Prisma)
RUN apk add --no-cache libc6-compat

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar solo los archivos de dependencias y el esquema de Prisma (esto optimiza el caché de Docker)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# 4. Instalar las dependencias dentro del contenedor (usando --legacy-peer-deps para evitar conflictos de React 19)
RUN npm install --legacy-peer-deps

# Generar el cliente de Prisma antes de copiar el resto del código
RUN npx prisma generate

# 5. Copiar todo el resto del código del proyecto (el .dockerignore evitará que pasen archivos innecesarios o secretos)
COPY . .

# Desactivar la telemetría de Next.js durante la compilación
ENV NEXT_TELEMETRY_DISABLED=1

# 6. Construir la aplicación Next.js para producción
RUN npm run build

# 7. Exponer el puerto por defecto de Next.js
EXPOSE 3000

# 8. Comando para iniciar la aplicación cuando el contenedor arranque
CMD ["npm", "start"]