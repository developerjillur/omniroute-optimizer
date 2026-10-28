FROM node:24.15.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libsecret-1-0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 OMNIROUTE_MITM_STUB=1 \
    OMNIROUTE_MEMORY_MB=2048 NODE_OPTIONS=--max-old-space-size=2048
COPY --chown=node:node dist/ ./
COPY --chown=node:node --chmod=755 start-cloud.sh ./start-cloud.sh
USER node
EXPOSE 20128
HEALTHCHECK --interval=30s --timeout=8s --start-period=40s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:20128/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["/app/start-cloud.sh"]
