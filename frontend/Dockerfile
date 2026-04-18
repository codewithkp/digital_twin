FROM node:20-alpine AS builder
WORKDIR /workspace
# Copy shared types so the webpack alias resolves during build
COPY shared/ ./shared/
COPY frontend/package*.json ./frontend/
WORKDIR /workspace/frontend
RUN npm ci
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /workspace/frontend/.next/standalone ./
COPY --from=builder /workspace/frontend/.next/static ./.next/static
COPY --from=builder /workspace/frontend/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
