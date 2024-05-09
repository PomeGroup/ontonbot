FROM node:latest  

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files into the container at /usr/src/app
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the rest of your application's code into the container at /usr/src/app
COPY . .

# Set the command to run your script
CMD [ "npm", "start" ]
