Cloud-Service-of-Kotoa-Smart-Home
=============
The cloud part of Kotoa Smart Home project. 

node.js application

Foundation + React + Jquery framework

Build
=============
Once you have the repositiry cloned , run the following code in console.

npm install

node static-server.js

Then visit http://localhost:3000/user

More...
=============
The database connection of my heroku server got something wrong, so actually runs locally.
To run it on my server, change the url in web/user/init.jsx, uncomment the following line.
var baseurl = "https://stark-sea-8955.herokuapp.com"
because there is no database connection, you can't see any data at present

