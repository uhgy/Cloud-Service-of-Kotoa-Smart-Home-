// TODO: Split into smaller files

//! Environment variables
var DB_URL = process.env.DATABASE_URL || "postgres://hgy:hgy@localhost:5432/database";
console.log("DB_URL =", DB_URL);

//! Promise
var Promise = require("bluebird");

//! Express
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

//! Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

//! Bcrypt
var bcrypt = require('bcryptjs');
Promise.promisifyAll(bcrypt);

//! Base32, UUID
var base32 = require('base32');
var uuid = require('node-uuid');

//! PostgreSQL Client
var pgpLib = require('pg-promise');
var pgp = pgpLib({ promiseLib: Promise });
var db = pgp(DB_URL);

//! Hex string to ASCII string
function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

//! Local Authentication Strategy
passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function (email, password, done) {
  var user;
  console.log("Authenticating using local strategy.");
  db.one("SELECT * FROM users WHERE email= $1", email)
    .then(function (data) {
      user = data;
      console.log("Verifying password against hash.");
      if (!bcrypt.compareSync(password, user.password)) {
        throw "Invalid password.";
      }
      if (user.accesstoken === "") {
        console.log("Updating access token.");
        user.accesstoken = base32.encode(uuid.v4());
        return db.none("UPDATE users SET accesstoken=$1 WHERE userid=$2", [user.accesstoken, user.userid]);
      }
    })
    .then(function () {
      console.log("Authenticated.");
      done(null, user);
    })
    .catch(function (err) {
      console.log("Authentication failed.", err);
      done(null, false, { message: 'Authentication failed.' });
    });
}));

//! Bearer Authentication Strategy
passport.use('bearer', new BearerStrategy(function (token, done) {
  console.log("Authenticating using bearer strategy.");
  db.one("SELECT * FROM users WHERE accesstoken=$1", token)
    .then(function (user) {
      console.log("Authenticated.");
      done(null, user);
    })
    .catch(function (err) {
      console.log("Authentication failed.", err);
      done(null, false, { message: 'Authentication failed.' });
    });
}));

//! Called after authentication
passport.serializeUser(function (user, done) {
  done(null, user.accesstoken);
});

//! ???
passport.deserializeUser(function (token, done) {
  db.one("SELECT * FROM users WHERE accesstoken=$1", token)
    .then(function (user) {
      done(null, user);
    })
    .catch(function (err) {
      done(err, null);
    });
});

//! Express configuration
app.use('/www', express.static(__dirname + '/www'));
app.use('/user', express.static(__dirname + '/user'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//! Express middleman, logging
app.use('/', function (req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
});

//! Query users
app.get('/users', passport.authenticate('bearer'), function (req, res) {
  console.log("Querying users.");
  if (req.user.email === "admin") {
    db.query("SELECT * FROM users")
      .then(function (data) {
        res.json(data.map(function (user) { return { userid: user.userid, email: user.email }; }));
      })
      .catch(function (err) {
        console.log("Query failed.", err);
        res.send("Query failed.");
      });
  } else {
    res.json([]);
  }
});

//! Sign up
app.post('/users', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var accesstoken = null;

  console.log("Signing up user.");
  db.none("SELECT * FROM users WHERE email = $1", email)
    .then(function () {
      console.log("Hashing password.");
      return bcrypt.hashAsync(password, 10);
    })
    .then(function (passwordhash) {
      accesstoken = base32.encode(uuid.v4());
      return db.none("INSERT INTO users VALUES ($1,$2,$3,$4)", [uuid.v4(), email, passwordhash, accesstoken]);
    })
    .then(function () {
      console.log("Signup success.");
      res.send(accesstoken);
    })
    .catch(function (err) {
      console.log("Signup failed.", err);
      res.send("Signup failed.");
    });
});

//! Log in
app.get('/login', passport.authenticate('local'), function (req, res) {
  console.log("Logged in.");
  res.send(req.user.accesstoken);
});

//! Log out
app.post('/logout', passport.authenticate('bearer'), function (req, res) {
  console.log("Logging out.");
  db.none("UPDATE users SET accesstoken=$1 WHERE userid=$2", ["", req.user.userid])
    .then(function () {
      console.log("Logged out.");
      res.send("Logged out.");
    })
    .catch(function (err) {
      console.log("Log out failed.", err);
      res.send("Log out failed.");
    });
});

//! Retrieve user
app.get('/users/:userid', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving user.");
  if (req.user.email === "admin") {
    db.one("SELECT * FROM users WHERE userid = $1", req.params.userid)
      .then(function (data) {
        console.log("Retrieved user.");
        res.json({ userid: data.userid, email: data.email });
      })
      .catch(function (err) {
        console.log("Retrieval failed.", err);
        res.send("Retrieval failed.");
      });
  } else {
    res.json({});
  }
});

//! Update or verify user
app.put('/users/:userid', passport.authenticate('bearer'), function (req, res) {
  console.log("Updating or verifying user.");
  res.send("Not implemented.");
});

//! Delete user
app.delete('/users/:userid', passport.authenticate('bearer'), function (req, res) {
  console.log("Deleting user.");
  if (req.user.email === "admin") {
    db.none("DELETE FROM users WHERE userid = $1", req.params.userid)
      .then(function () {
        console.log("Deleted user.");
        res.send("Deleted user.");
      })
      .catch(function (err) {
        console.log("Deletion failed.", err);
        res.send("Deletion failed.");
      });
  } else {
    console.log("Deletion failed.");
    res.send("Deletion failed.");
  }
});

//! Request password reset
app.post('/forgot', function (req, res) {
  console.log("Requested password reset.");
  var resetpasswordtoken = base32.encode(uuid.v4());
  var resetpasswordexpires = new Date(new Date() + 60000);
  db.none("UPDATE users SET resetpasswordtoken = $1, resetpasswordexpires = $2 WHERE email=$3", [resetpasswordtoken, resetpasswordexpires, req.params.email])
    .then(function () {
      // TODO
      console.log("Request password reset failed.");
      res.send("Request password reset failed.");
      
      // var smtpTransport = nodemailer.createTransport('SMTP', {
      //   service: 'SendGrid',
      //   auth: {
      //     user: '!!! YOUR SENDGRID USERNAME !!!',
      //     pass: '!!! YOUR SENDGRID PASSWORD !!!'
      //   }
      // });
      // var mailOptions = {
      //   to: req.user.email,
      //   from: 'passwordreset@kotoa.fi',
      //   subject: 'Kotoa Password Reset',
      //   text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      //     'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      //     'http://' + req.headers.host + '/reset/' + token + '\n\n' +
      //     'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      // };
      // smtpTransport.sendMail(mailOptions, function(err) {
      //   if (err) {
      //     console.log("Request password reset failed.", err);
      //     res.send("Request password reset failed.");
      //   } else {
      //     console.log("Request password reset ok.");
      //     req.send('An e-mail has been sent to ' + user.email + ' with further instructions.');
      //   }
      // });
    })
    .catch(function (err) {
      console.log("Request password reset failed.", err);
      res.send("Request password reset failed.");
    });
});

//! Retrieve all rooms
app.get('/rooms', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving all rooms.");
  db.query("SELECT * FROM rooms WHERE userid = $1", req.user.userid)
    .then(function (data) {
      console.log("Retrieved all rooms.");
      res.json(data.map(function (a) { return { roomid: a.roomid, name: a.name }; }));
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Create room
app.post('/rooms', passport.authenticate('bearer'), function (req, res) {
  console.log("Creating room.");
  db.none("INSERT INTO rooms VALUES ($1,$2,$3)", [uuid.v4(), req.user.userid, req.body.name])
    .then(function () {
      console.log("Created room.");
      res.send("Created room.");
    })
    .catch(function (err) {
      console.log("Creating room failed.", err);
      res.send("Creating room failed.");
    });
});

//! Retrieve room
app.get('/rooms/:roomid', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving room.");
  db.one("SELECT * FROM rooms WHERE userid = $1 and roomid = $2", [req.user.userid, hex2a(req.params.roomid)])
    .then(function (data) {
      console.log("Retrieved room.");
      res.json({ roomid: data.roomid, name: data.name });
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Update room
app.put('/rooms/:roomid', passport.authenticate('bearer'), function (req, res) {
  console.log("Updating room.");
  db.none("UPDATE rooms SET name = $1 WHERE userid = $2 and roomid = $3", [req.body.name, req.user.userid, hex2a(req.params.roomid)])
    .then(function () {
      console.log("Updated room.");
      res.send("Updated room.");
    })
    .catch(function (err) {
      console.log("Updating room failed.", err);
      res.send("Updating room failed.");
    });
});

//! Delete room
app.delete('/rooms/:roomid', passport.authenticate('bearer'), function (req, res) {
  console.log("Deleting room.");
  db.none("DELETE FROM rooms WHERE userid = $1 and roomid = $2", [req.user.userid, hex2a(req.params.roomid)])
    .then(function () {
      console.log("Deleted room.");
      res.send("Deleted room.");
    })
    .catch(function (err) {
      console.log("Deleting room failed.", err);
      res.send("Deleting room failed.");
    });
});

//! Retrieve all nodes
app.get('/nodes', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving all nodes.");
  db.query("SELECT * FROM nodes WHERE userid = $1", req.user.userid)
    .then(function (data) {
      console.log("Retrieved all nodes.");
      res.json(data.map(function (a) { return { nodeid: a.nodeid, roomid: a.roomid, name: a.name, type: a.type, status: a.status }; }));
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Retrieve nodes
app.get('/rooms/:roomid/nodes', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving nodes.");
  db.query("SELECT * FROM nodes WHERE userid = $1 and roomid = $2", [req.user.userid, hex2a(req.params.roomid)])
    .then(function (data) {
      console.log("Retrieved nodes.");
      res.json(data.map(function (a) { return { nodeid: a.nodeid, roomid: a.roomid, name: a.name, type: a.type, status: a.status }; }));
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Create node
app.post('/nodes', passport.authenticate('bearer'), function (req, res) {
  console.log("Creating node.");
  db.none("INSERT INTO nodes VALUES ($1,$2,$3,$4,$5,$6)", [uuid.v4(), req.user.userid, null, req.params.name, req.params.type, {}])
    .then(function () {
      console.log("Created node.");
      res.send("Created node.");
    })
    .catch(function (err) {
      console.log("Creating node failed.", err);
      res.send("Creating node failed.");
    });
});

//! Retrieve node
app.get('/nodes/:nodeid', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving node.");
  db.one("SELECT * FROM nodes WHERE userid = $1 and nodeid = $2", [req.user.userid, hex2a(req.params.nodeid)])
    .then(function (data) {
      console.log("Retrieved room.");
      res.json({ nodeid: a.nodeid, roomid: data.roomid, name: data.name, type: data.type, status: data.status });
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Update node
app.put('/nodes/:nodeid', passport.authenticate('bearer'), function (req, res) {
  console.log("Updating node.");
  db.none("UPDATE nodes SET roomid = $1, name = $2 WHERE userid = $3 and nodeid = $4", [hex2a(req.body.roomid), req.body.name, req.user.userid, hex2a(req.params.nodeid)])
    .then(function () {
      console.log("Updated node.");
      res.send("Updated node.");
    })
    .catch(function (err) {
      console.log("Updating node failed.", err);
      res.send("Updating node failed.");
    });
});

//! Delete node
app.delete('/nodes/:nodeid', passport.authenticate('bearer'), function (req, res) {
  console.log("Deleting node.");
  db.none("DELETE FROM nodes WHERE userid = $1 and nodeid = $2", [req.user.userid, hex2a(req.params.nodeid)])
    .then(function () {
      console.log("Deleted node.");
      res.send("Deleted node.");
    })
    .catch(function (err) {
      console.log("Deleting node failed.", err);
      res.send("Deleting node failed.");
    });
});

//! Retrieve events
app.get('/nodes/:nodeid/events', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving events.");
  db.query("SELECT * FROM events WHERE userid = $1 and nodeid = $2 ORDER BY time DESC LIMIT 10", [req.user.userid, hex2a(req.params.nodeid)])
    .then(function (data) {
      console.log("Retrieved events.");
      res.json(data.map(function (a) { return { time: a.time, status: a.status }; }));
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Create event
app.put('/nodes/:nodeid/events', passport.authenticate('bearer'), function (req, res) {
  console.log("Creating event.");
  db.none("INSERT INTO events VALUES ($1,$2,$3,$4,$5)", [uuid.v4(), req.user.userid, hex2a(req.params.nodeid), req.body.time, req.body.status])
    .then(function () {
      return db.none("UPDATE nodes SET status = $1 WHERE userid = $2 and nodeid = $3", [req.body.status, req.user.userid, hex2a(req.params.nodeid)]);
    })
    .then(function () {
      console.log("Created event.");
      res.send("Created event.");
    })
    .catch(function (err) {
      console.log("Creating event failed.", err);
      res.send("Creating event failed.");
    });
});

//! Retrieve preferences
app.get('/nodes/:nodeid/preferences', passport.authenticate('bearer'), function (req, res) {
  console.log("Retrieving preferences.");
  db.one("SELECT * FROM nodes WHERE userid = $1 and nodeid = $2", [req.user.userid, hex2a(req.params.nodeid)])
    .then(function (data) {
      console.log("Retrieved preferences.");
      res.json({ preferences: a.preferences });
    })
    .catch(function (err) {
      console.log("Retrieval failed.", err);
      res.send("Retrieval failed.");
    });
});

//! Update preferences
app.put('/nodes/:nodeid/preferences', passport.authenticate('bearer'), function (req, res) {
  console.log("Updating preferences.");
  db.none("UPDATE nodes SET preferences = $1 WHERE userid = $2 and nodeid = $3", [req.body.preferences, req.user.userid, hex2a(req.params.nodeid)])
    .then(function () {
      console.log("Updated preferences.");
      res.send("Updated preferences.");
    })
    .catch(function (err) {
      console.log("Updating preference failed.", err);
      res.send("Updating preference failed.");
    });
});

//! Delete preferences
app.delete('/nodes/:nodeid/preferences', passport.authenticate('bearer'), function (req, res) {
  console.log("Deleting preferences.");
  db.none("UPDATE nodes SET preferences = $1 WHERE userid = $2 and nodeid = $3", [[], req.user.userid, hex2a(req.params.nodeid)])
    .then(function () {
      console.log("Deleted preferences.");
      res.send("Deleted preferences.");
    })
    .catch(function (err) {
      console.log("Deleting preferences failed.", err);
      res.send("Deleting preferences failed.");
    });
});

//! Drop tables
function dropTables() {
  console.log("Dropping tables.");
  return db.none("DROP TABLE IF EXISTS users, rooms, nodes, events")
    .catch(function (err) {
      console.log("Dropping tables failed.", err);
    });
}

//! Create tables
function createTables() {
  console.log("Creating tables.");
  db.none(
    "CREATE TABLE IF NOT EXISTS users (\
      userid uuid PRIMARY KEY,\
      email text,\
      password text,\
      accesstoken text,\
      resetpasswordtoken text,\
      resetpasswordexpires timestamp)"
  ).then(function () {
    return db.none(
      "CREATE TABLE IF NOT EXISTS rooms (\
        roomid uuid PRIMARY KEY,\
        userid uuid,\
        name text,\
        FOREIGN KEY (userid) REFERENCES users ON DELETE CASCADE ON UPDATE CASCADE)"
    );
  }).then(function () {
    return db.none(
      "CREATE TABLE IF NOT EXISTS nodes (\
        nodeid uuid PRIMARY KEY,\
        userid uuid,\
        roomid uuid REFERENCES rooms ON DELETE SET NULL,\
        name text,\
        type text,\
        preferences json,\
        status json,\
        FOREIGN KEY (userid) REFERENCES users ON DELETE CASCADE ON UPDATE CASCADE)"
    );
  }).then(function () {
    return db.none(
      "CREATE TABLE IF NOT EXISTS events (\
        eventid uuid PRIMARY KEY,\
        userid uuid,\
        nodeid uuid,\
        time timestamp,\
        status json,\
        FOREIGN KEY (nodeid) REFERENCES nodes ON DELETE CASCADE ON UPDATE CASCADE)"
    );
  }).catch(function (err) {
    console.log("Creating tables failed.", err);
  });
}

//! Create admin user
function createAdminUser() {
  console.log("Creating admin user.");
  var email = "admin";
  var passwordhash = bcrypt.hashSync("admin", 10);
  return db.none("INSERT INTO users VALUES ($1,$2,$3,$4)", [uuid.v4(), email, passwordhash, ""])
    .catch(function (err) {
      console.log("Creating admin user failed.", err);
    });
}

dropTables().then(createTables).then(createAdminUser);

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});
