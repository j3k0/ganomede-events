FROM node:14-slim

EXPOSE 8000
MAINTAINER Jean-Christophe Hoelt <hoelt@fovea.cc>

# Create 'app' user
RUN useradd app -d /home/app

# Install NPM packages
COPY package.json /home/app/code/package.json
COPY package-lock.json /home/app/code/package-lock.json
RUN cd /home/app/code && npm install

# Copy app source files
COPY tsconfig.json index.ts config.ts .eslintrc /home/app/code/
COPY src /home/app/code/src
RUN chown -R app /home/app && cd /home/app/code && npm run build

USER app
WORKDIR /home/app/code
CMD npm start
