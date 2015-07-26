var Router = ReactRouter;
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;


//keep cookie alive
function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

//read cookie
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

//erase cookie
function eraseCookie(name) {
    createCookie(name,"",-1);
}


//get and store data temporarilly, because there still exists some bugs in database related methods 
var localDb = {
  rooms: [],
  nodes: [],
  getRoom: function(roomid) {
    var res = localDb.rooms.filter(function(room) { console.log(room); return room.roomid === roomid; })[0];
    return res;
  },
  getNode: function(nodeid) {
    var res = localDb.nodes.filter(function(node) { 
      //console.log(node); 
      return node.nodeid === nodeid; })[0];
    return res;
  }
};


//running environment, on a server or local

//var baseurl = "https://stark-sea-8955.herokuapp.com";
var baseurl = "http://localhost:3000";
var accessToken = readCookie('remember_me');


//login in post method 
var postLogin = function (email, password) {
  return $.ajax({
    url: baseurl + "/login",
    method: "POST",
    data: { email: email, password: password }
  }).done(function(data) {
    console.log(data);
    accessToken = data;
  }).fail(function(err) {
    console.log(err);
    // error
  });
};

//sign up
var postSignup = function (email, password) {
  return $.ajax({
    url: baseurl + "/users",
    method: "POST",
    data: { email: email, password: password }
  }).done(function(data) {
    console.log(data);
    accessToken = data;
  }).fail(function(err) {
    console.log(err);
    // error
  });
}

// logout
var postLogout = function () {
  return $.ajax({
    url: baseurl + "/logout?access_token=" + accessToken,
    method: "POST"
  }).done(function(data) {
    console.log(data);
    accessToken = "";
  }).fail(function(err) {
    console.log(err);
    // error
  });
};

//add rooms
var addRooms = function (name) {
  return $.ajax({
    url: baseurl + "/rooms",
    method: "POST",
    data: {name: name, access_token: accessToken}
  }).done(function(data) {
    console.log(data);
  }).fail(function(err) {
    console.log(err);
    // error
  });
};

//add Nodes
var addNodes = function (name, type) {
  return $.ajax({
    url: baseurl + "/nodes",
    method: "POST",
    data: {name: name, type: type, access_token: accessToken}
  }).done(function(data) {
    console.log(data);
  }).fail(function(err) {
    console.log(err);
    // error
  });
};

//update rooms
var updateRooms = function (roomid, name) {
  return $.ajax({
    url: baseurl + "/rooms/"+roomid,
    method: "PUT",
    data: { name: name, access_token: accessToken}
  }).done(function(data) {
    console.log(data);
  }).fail(function(err, a) {
    console.log(err, a);
    //error
  });
};

//update nodes
var updateNodes = function (nodeid, roomid, name) {
  return $.ajax({
    url: baseurl + "/nodes/"+nodeid,
    method: "PUT",
    data: { name: name, roomid: roomid, access_token: accessToken}
  }).done(function(data) {
    console.log(data);
  }).fail(function(err, a) {
    console.log(err, a);
    //error
  });
};


//delete rooms
var deleteRooms = function (roomid) {
  return $.ajax({
    url: baseurl + "/rooms/"+roomid,
    method: "DELETE",
    data: { access_token: accessToken}
  }).done(function(data) {
    console.log(data);
  }).fail(function(err) {
    console.log(err);
    //error
  });
};

// get all rooms
var getAllRooms = function() {
  return $.ajax({
    url: baseurl + "/rooms?access_token=" + accessToken,
    method: "GET",
  }).done(function(data) {
    console.log('ingetallrooms');
    localDb.rooms = data;
  }).fail(function(err) {
    console.log(err);
    // error
  });
};

// get all nodes
var getAllNodes = function() {
  return $.ajax({
    url: baseurl + "/nodes?access_token=" + accessToken,
    method: "GET"
  }).done(function(data) {
    console.log(data);
    localDb.nodes = data;
  }).fail(function(err) {
    console.log(err);
    // error
  });
};
