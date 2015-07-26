
//! Express
var express = require('express');
var app = express();

//! Express configuration
app.use('/www', express.static(__dirname + '/www'));
app.use('/user', express.static(__dirname + '/user'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});
