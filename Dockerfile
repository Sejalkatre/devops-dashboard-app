FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm","start"]
