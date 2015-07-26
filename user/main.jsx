var Navigation = Router.Navigation;

var isRegistering = false;

var render = function() {
  Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
  $(document).foundation();
});
};

var App = React.createClass({
  render: function () {
    console.log('render', accessToken);

    if (isRegistering) {
      return <Register />
    }

    if (accessToken === '') {
      return <LogIn />;
    }

    var divStyle = {
      minHeight: '100%',
      position: 'relative'
    };
    var bodyStyle = {
      padding: '0px',
      paddingBottom: '4rem'
    };
    return (
      <div style={divStyle}>
        <Header />
        <br/>
        <div className="row" style={bodyStyle}>
          <div className="large-12 medium-12 small-12 columns">
            <RouteHandler />
          </div>
        </div>
        <br/>
        <Footer />
      </div>
    );
  }
});

var LogIn = React.createClass({
  handleClick: function() {
    var self = this;
    postLogin(this.state.email, this.state.password)
      .done(function() {
        createCookie('remember_me',accessToken,7);
        render();
      });
  },
  handleRegisterClick: function() {
    isRegistering = true;
    render();
  },
  getInitialState: function() {
    return {email: '', password: ''};
  },
  handleChangeEmail: function(event) {
    this.setState({email: event.target.value});
  },
  handleChangePassword: function(event) {
    this.setState({password: event.target.value});
  },
  render: function () {
    return (
      <div>
        <h2 className="text-center">Log    In</h2>
        <form>
          <div className="row">
            <div className="large-12 columns">
              <label>Email
                <input type="email" value={this.state.email} onChange={this.handleChangeEmail}/>
              </label>
              <label>Password 
                <input type="password" value={this.state.password} onChange={this.handleChangePassword}/>
              </label>
              <input type="submit" value="Login" onClick={this.handleClick} className="button"></input>
              <a onClick={this.handleRegisterClick} className="button right">Sign up</a>
            </div>
          </div>
        </form>
      </div>
    );
  }
});

var Register = React.createClass({
  handleClick: function() {
    postSignup(this.state.email, this.state.password)
      .done(function() {
        createCookie('remember_me',accessToken,7);
        isRegistering = false;
        render();
      });
  },
  handleLoginClick: function() {
    isRegistering = false;
    render();
  },
  getInitialState: function() {
    return {email: '', password: ''};
  },
  handleChangeEmail: function(event) {
    this.setState({email: event.target.value});
  },
  handleChangePassword: function(event) {
    this.setState({password: event.target.value});
  },
  render: function () {
    return (
      <div>
        <h2 className="text-center">Sign up</h2>
        <form>
          <div className="row">
            <div className="large-12 columns">
              <label>Email
                <input type="email" value={this.state.email} onChange={this.handleChangeEmail}/>
              </label>
              <label>Password 
                <input type="password" value={this.state.password} onChange={this.handleChangePassword}/>
              </label>
              <input type="submit" value="Signup" onClick={this.handleClick} className="button"></input>
              <a onClick={this.handleLoginClick} className="button right">Already registered</a>
            </div>
          </div>
        </form>
      </div>
    );
  }
});

var Overview = React.createClass({

  render: function () {
    return (
      <div>
        <h4>Overview</h4>
      </div>
    );
  }
});

var Rooms = React.createClass({
  handleAddClick: function() {
    var self = this;
    addRooms(this.state.name).done(function() {
      getAllRooms().done(function(data) {
        self.setState({rooms: localDb.rooms});
        console.log('1');
      });
    });
    this.setState({name: ''});
    console.log('2');
  },
  componentWillMount: function() {
    var self = this;
    getAllRooms().done(function(data) {
      console.log('3');
      self.setState({rooms: localDb.rooms});
    });
  },
  getInitialState: function() {
    return {rooms: localDb.rooms, name: ''};
  },
  handleChangeName: function(event) {
    this.setState({name: event.target.value});
  },
  render: function () {
    console.log('4');
    return (    
      <div>
        <h1>Rooms</h1>
        <ul className="small-block-grid-1">
          {_.sortBy(this.state.rooms, 'name').map(function(room) {
            return <li key={room.roomid}><Link to="room" params={room}>{room.name}</Link></li>;
          })}
        </ul>
        <form>
          <div className="row">
            roomname:<input type="text" value={this.state.name} onChange={this.handleChangeName}/>
            <input type="submit" value="add" onClick={this.handleAddClick} className="button"></input>
          </div>
        </form>
      </div>
    );
  }
});

var Room = React.createClass({
  mixins: [Router.State],
  handleClick: function() {
    deleteRooms(this.getParams().roomid);
  },
  handleClickUpdate: function() {
    var self = this;
    updateRooms(this.getParams().roomid, this.state.name).done(function() {
      getAllRooms().done(function() {
        self.setState({room: localDb.getRoom(self.getParams().roomid)});
      });
    });
  },
  componentWillMount: function() {
    console.log('asd', this.getParams());
    var self = this;
    if (localDb.rooms.length === 0) {
      getAllRooms().done(function() {
        getAllNodes().done(function() {
          console.log(localDb.nodes);
          self.setState({room: localDb.getRoom(self.getParams().roomid)});
        });
      });
    }
  },
  getInitialState: function() {
    return {
      room: localDb.getRoom(this.getParams().roomid), name: ''};
  },
  handleChangeName: function(event) {
    this.setState({name: event.target.value});
  },
          
          // {_.map(_.filter(localDb.nodes, function(node) {
          //   return node.roomid == self.state.room.roomid;
          // }), function(node) {
          //   console.log("ok");
          //   return <li key={node.nodeid}><Link to="node" params={node}>{node.name}ok</Link></li>;
          // })}


          // {_.filter(localDb.nodes, function(node) {
          //   return node.roomid == self.state.room.roomid;
          // }).map(function(node) {
          //   console.log(node+"ok");
          //   return <li key={node.nodeid}><Link to="node" params={node}>{node.name}ok</Link></li>;
          // })}


  render: function () {
    var self = this;
    console.log(self.state.room);
    console.log(localDb.nodes);
    // var res = _.filter(localDb.nodes, function(node) {
    //   return node.roomid == self.state.room.roomid;
    // })
    // console.log(res);


    if (!this.state.room)
      return <p>Please wait...</p>
    return (
      <div>
        <h4>{this.state.room.name}</h4>
        <ul className="small-block-grid-1">
          {_.filter(localDb.nodes, function(node) {
            console.log(node);
            return node.roomid == self.state.room.roomid;
          }).map(function(node) {
            console.log(node+"ok");
            return <li key={node.nodeid}><Link to="node" params={node}>{node.name}ok</Link></li>;
          })
          }
        </ul>
        <Link to="rooms"><a onClick={this.handleClick} className="button">delete this room</a></Link>
        <form>
        <div className="row">
          <div className="large-9 columns">
            <div className="row">
              <div className="large-6 columns">
                <input type="text" value={this.state.name} onChange={this.handleChangeName} id="right-label" placeholder="change room name"/>
              </div>
              <div className="large-6 columns">
                <Link to="rooms"><a onClick={this.handleClickUpdate} className="button">update this room</a></Link>
              </div>
            </div>
          </div>
        </div>
        </form>
      </div>
    );
  }
});


          // {_.sortBy(self.state.nodes, 'room').map(function(node) {
          //   console.log(node);
          //   if (node.room) {
          //     return <li key={node.id}><Link to="node" params={node}>{node.room} / {node.name}</Link></li>;
          //   }
          //   return <li key={node.id}><Link to="node" params={node}>{node.name}</Link></li>;
          // })}

var Nodes = React.createClass({
  handleAddClick: function() {
    var self = this;
    addNodes(this.state.name, this.state.type).done(function() {
      getAllNodes().done(function(data) {
        self.setState({nodes: localDb.nodes});
      });
    });
    this.setState({name: '', type: ''});
  },  
  componentWillMount: function() {
    var self = this;
    getAllNodes().done(function(data) {
      self.setState({nodes: localDb.nodes});
    });
  },
  getInitialState: function() {
    return {nodes: localDb.nodes, name: '', type: ''};
  },
  handleChangeName: function(event) {
    this.setState({name: event.target.value});
  },
  handleChangeType: function(event) {
    this.setState({type: event.target.value});
  },
  render: function () {
    var self = this;
    return (
      <div>
        <h4>Nodes</h4>
        <ul className="small-block-grid-6">
          {_.sortBy(this.state.nodes, 'name').map(function(node) {
            return <li key={node.nodeid}><Link to="node" params={node}>{node.name}</Link></li>;
          })}
        </ul>
        <form>
          <div className="row">
            nodename:<input type="text" value={this.state.name} onChange={this.handleChangeName}/>
            nodetype:<input type="text" value={this.state.type} onChange={this.handleChangeType}/>
            <input type="submit" value="Add" onClick={this.handleAddClick} className="button"></input>
          </div>
        </form>
      </div>
    );
  }
});

var Node = React.createClass({
  mixins: [Router.State],
  getInitialState: function() {
    console.log(this.getParams());
    return {node: localDb.getNode(this.getParams().nodeid)
      //,
            // nodename: localDb.getNode(this.getParams().nodeid).name,
            // nodeid: localDb.getNode(this.getParams().nodeid).nodeid,
            // roomid: localDb.getNode(this.getParams().nodeid).roomid 
          };
  }, 
  componentWillMount: function() {
    console.log('asd', this.getParams());
    var self = this;
    if (localDb.nodes.length === 0) {
      getAllNodes().done(function() {
        self.setState({ node: localDb.getNode(self.getParams().nodeid)
          //,                  
            // nodename: localDb.getNode(self.getParams().nodeid).name,
            // nodeid: localDb.getNode(self.getParams().nodeid).nodeid,
            // roomid: localDb.getNode(self.getParams().nodeid).roomid   
        });
      });
    }
  }, 
  handleChangeName: function(event) {
    this.setState({nodename: event.target.value});
  },
  handleChangeRoomid: function(event) {
    this.setState({roomid: event.target.value});
  },
  handleUpdateClick: function() {
    var self = this;
    updateNodes(this.state.node.nodeid, this.state.node.room, this.state.node.name).done(function() {
      getAllNodes().done(function(data) {
        self.setState({nodes: localDb.nodes});
      });
    });
    //this.setState({nodename: '', roomid: ''});
  }, 
            // {_.forEach(this.state.nodes, function(key, value) {
            // console.log(key, value);  
  render: function () {
    console.log(localDb.nodes);
    console.log(this.state.node); 
    console.log( ' ' + this.state.nodename +' ' + this.state.roomid +' ' + this.state.nodeid);
    
    if (!this.state.node)
      return <p>Please wait...</p>
    return (
      <div>
        <h4>Node</h4>
        <ul className="small-block-grid-6">
            {this.state.nodeid} {this.state.nodename}
        </ul>

        nodename:<input type="text" value={this.state.nodename} onChange={this.handleChangeName}/>
        roomid:<input type="text" value={this.state.roomid} onChange={this.handleChangeRoomid}/>
        <input type='submit' value='update' onClick={this.handleUpdateClick} className='button'/>
        <a></a>
      </div>
    );
  }
});

var Notifications = React.createClass({
  render: function () {
    return (
      <h4>Notifications</h4>
    );
  }
});

var Settings = React.createClass({
  render: function () {
    return (
      <h4>Settings</h4>
    );
  }
});

var Help = React.createClass({
  render: function () {
    return (
      <h4>Help Center</h4>
    );
  }
});

var LogOut = React.createClass({
  mixins: [Navigation],
  componentDidMount: function() {
    var self=this;
    postLogout()
      .done(function() {
        eraseCookie('remember_me');
        self.transitionTo("/");
        render();
      });
  },
  render: function () {
    return (
      <h4>Log out</h4>
    );
  }
});

var NotFound = React.createClass({
  render: function () {
    return (
      <h4>Not found</h4>
    );
  }
});

var routes = (
  <Route name="app" handler={App} path="/">
    <DefaultRoute handler={Overview}/>
    <Route name="rooms" handler={Rooms} path="/rooms" />
    <Route name="room" handler={Room} path="/rooms/:roomid" />
    <Route name="nodes" handler={Nodes} path="/nodes" />
    <Route name="node" handler={Node} path="/nodes/:nodeid" />
    <Route name="notifications" handler={Notifications} path="/notifications"/>
    <Route name="settings" handler={Settings} path="/settings"/>
    <Route name="help" handler={Help} path="/help"/>
    <Route name="logout" handler={LogOut} path="/logout"/>
    <NotFoundRoute handler={NotFound}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
  $(document).foundation();
});
