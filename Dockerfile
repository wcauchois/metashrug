FROM node:wheezy
ARG SLACK_TOKENS
ARG WEBHOOK_URL
WORKDIR /usr/src/app
ENV SLACK_TOKENS ${SLACK_TOKENS}
ENV WEBHOOK_URL ${WEBHOOK_URL}
COPY package.json package-lock.json ./
RUN npm install
COPY index.js .
EXPOSE 3000
CMD [ "npm", "start" ]

