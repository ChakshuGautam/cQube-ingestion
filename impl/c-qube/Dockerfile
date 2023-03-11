FROM node:16.19

ENV NODE_ENV production
# setting workdir
WORKDIR /app

# copying package.json
USER node
COPY --chown=node:node package.json ./
RUN yarn install --frozen-lockfile

# copying the remaining files
COPY --chown=node:node . .
# COPY . .

EXPOSE 3000
CMD ["yarn", "start:prod"]
