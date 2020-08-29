FROM node:11

# Default env variables, override with docker-compose or at run-time
ENV TZ=Asia/Kolkata
ENV NODE_ENV=production
ENV PORT=3000

# Sets up timezone
ENTRYPOINT ["docker-entrypoint.sh"]

# Update npm to the latest version available
RUN npm update -g npm

# Make /app directory
RUN mkdir /app

# Set working dir for RUN, CMD, COPY, ENTRYPOINT to /app
WORKDIR /app

# Copy source files
COPY ./ ./

# Install node modules
RUN npm install

# Instruct the container to execute this by default
CMD ["npm", "start"]

# Expose the port the app starts on, so it can be accessed from outside the container
EXPOSE $PORT
