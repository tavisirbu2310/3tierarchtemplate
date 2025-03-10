FROM node:14

WORKDIR /code

COPY /code/package.json .

RUN npm install

COPY /code/dbConnect.js .

EXPOSE 80

# Run the app
CMD [ "node", "dbConnect.js" ]