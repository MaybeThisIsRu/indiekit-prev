FROM node:12

# Update npm to the latest version available
RUN npm update -g npm

# Set up environment variables
# ENV PORT=3000
# ENV NODE_ENV=productio
# ENV TZ=Europe/London
# ENV GITHUB_REPO=
# ENV GITHUB_TOKEN=
# ENV GITHUB_USER=
# ENV GITHUB_BRANCH=
# ENV INDIEKIT_CACHE_EXPIRES=
# ENV INDIEKIT_CONFIG_PATH=
# ENV INDIEKIT_LOCALE=
# ENV INDIEKIT_URL=

# # Sets up timezone
ENTRYPOINT [ "docker-entrypoint.sh" ]

# # Set working dir for RUN, CMD, COPY, ENTRYPOINT to /app
WORKDIR /app

# # Copy package manifest and install packages
# # COPY package*.json /app/

# Clean install
# RUN npm ci

# Copy everything else
# COPY . /app/

# Build
#

# Remove source files
#

# Instruct the container to execute this by default
CMD ["npm", "start"]

# Expose the port the app starts on, so it can be accessed from outside the container
EXPOSE $PORT
