FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Playwright deps
RUN npx playwright install --with-deps chromium

COPY . .

CMD ["node", "worker/updateGames.js"]
