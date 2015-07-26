Cloud-Service-of-Kotoa-Smart-Home
=============

Build
=============
Once you have the repositiry cloned , run the following code in console.
npm install
node static-server.js

More...
=============
The database connection of my heroku server got something wrong, so actually runs locally.
To run it on my server, change the url in web/user/init.jsx, uncomment the following line
var baseurl = "https://stark-sea-8955.herokuapp.com";

