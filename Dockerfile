FROM node:stretch
ARG SLACK_TOKENS
ARG WEBHOOK_URL
WORKDIR /usr/src/app
ENV SLACK_TOKENS ${SLACK_TOKENS}
ENV WEBHOOK_URL ${WEBHOOK_URL}
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python-dev
COPY package.json package-lock.json ./
RUN npm install
COPY index.js .
EXPOSE 3000
CMD [ "npm", "start" ]

