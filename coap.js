/// <reference path="typings/node/node.d.ts"/>

var coapex = require('./coapex');
var url = require('url');

var auth = function (req) {
  var u = url.parse(req.url, true);
  return u.query.access_token === '12345';
};

var router = new coapex.Router('/api/v1/');
router.get('/events', function (req, res) {
  console.log(req.body);
  res.json(req.body);
});

var server = new coapex.Server(router, auth, function () {
  coapex.get({
    host: 'localhost',
    pathname: '/api/v1/events?access_token=12345'
  }, {a: 1, b: 2, c: 3}, function (err, res) {
    console.log(res.body);
  });

  coapex.get({
    host: 'localhost',
    pathname: '/api/v1/events?access_token=123456'
  }, {a: 1, b: 2, c: 3}, function (err, res) {
    console.log(res.body);
  });

  coapex.get({
    host: 'localhost',
    pathname: '/api/v1/event?access_token=12345'
  }, {a: 1, b: 2, c: 3}, function (err, res) {
    console.log(res.body);
  });
});
