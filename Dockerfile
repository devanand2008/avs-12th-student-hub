FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts/setup-pdfjs.mjs ./scripts/setup-pdfjs.mjs
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
USER node

EXPOSE 3000

# This image contains the web app. A native model runtime must be provisioned separately.
CMD ["npm", "run", "start:web"]
