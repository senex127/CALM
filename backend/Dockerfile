FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --schema ./src/prisma/schema.prisma --accept-data-loss && npm run dev"]
