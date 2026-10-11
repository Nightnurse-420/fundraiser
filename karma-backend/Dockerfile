FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
# Dev: db push. After running `npm run db:migrate` once and committing prisma/migrations, switch to `prisma migrate deploy`.
CMD ["sh","-c","npx prisma db push --skip-generate && node src/server.js"]
