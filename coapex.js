var coap = require('coap');
var url = require('url');

var toType = function (obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

var Router = function (path) {
  var self = this;
  var routePath = path;
  if (routePath.indexOf('/', routePath.length - 1, 1) === -1) {
    routePath = routePath + '/';
  }
  self._routes = {};
  ['get', 'post', 'put', 'delete'].map(function (method) {
    self[method] = function (path, callback) {
      if (!self._routes[method]) {
        self._routes[method] = [];
      }
      if (path.indexOf('/', 0, 1) === -1) {
        path = '/' + path;
      } else {
        path = path.substr(1);
      }
      var p = routePath + path;
      self._routes[method].push({path: p, callback: function (req, res) {
        req.body = req.payload.toString();
        if (req.options['Content-Format'] === 'application/json') {
          req.body = JSON.parse(req.body);
        }
        res.send = function (str) {
          res.end(str);
        };
        res.json = function (obj) {
          res.options['Content-Format'] = 'application/json';
          res.end(JSON.stringify(obj));
        };
        callback(req, res);
      }});
    };
  });
};

var Server = function (router, auth, callback) {
  var coapServer = coap.createServer();
  coapServer.on('request', function (req, res) {
    if (!auth || auth(req)) {
      console.log('SERVER: Authorized');
      var u = url.parse(req.url);
      var r = router._routes[req.method.toLowerCase()].filter(function (route) {
        return route.path === u.pathname;
      });
      if (r.length === 0) {
      console.error('SERVER: Resource not found');
        res.end('Resource not found');
      } else {
        r.forEach(function (route) {
          route.callback(req, res);
        });
      }
    } else {
      console.error('SERVER: Unauthorized');
      res.end('Unauthorized');
    }
  });
  coapServer.listen(callback);
};

var _request = function (arg, payload, callback) {
  var req = coap.request(arg);
  if (toType(payload) !== 'string') {
    if (!arg.options) {
      arg.options = {};
    }
    arg.options['Content-Format'] = 'application/json';
  }
  if (arg.options && arg.options['Content-Format'] === 'application/json') {
    req.write(JSON.stringify(payload));
  } else {
    req.write(payload);
  }
  req.on('response', function (res) {
    res.on('data', function () {
    });
    res.on('end', function () {
      res.body = res.payload.toString();
      if (res.options['Content-Format'] === 'application/json') {
        res.body = JSON.parse(res.body);
      }
      callback(null, res);
    });
  });
  req.end();
};

var Request = function () {
  var self = this;
  ['get', 'post', 'put', 'delete'].map(function (method) {
    self[method] = function (arg, payload, callback) {
      arg.method = method.toUpperCase();
      _request(arg, payload, callback);
    };
  });
};

var _r = new Request();

module.exports = {
  Router: Router,
  Server: Server,
  get: _r.get,
  post: _r.post,
  put: _r.put,
  delete: _r.delete
};
