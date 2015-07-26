var NavDivider = React.createClass({

  render: function() {
    return <li className="divider"></li>;
  }

});

var NavListItem = React.createClass({

  render: function() {
    var content;
    if (this.props.icon) {
      content = <div><i className={this.props.icon}></i> {this.props.text}</div>;
    } else {
      content = <div>{this.props.text}</div>;
    }
    return <li><Link to={this.props.link}>{content}</Link></li>;
  }

});

var Header = React.createClass({

	render: function() {
		return (
      <nav className="top-bar" data-topbar role="navigation">
        <ul className="title-area">
          <li className="name">
            <h1><a href="#">SMART HOME</a></h1>
          </li>
          <li className="toggle-topbar menu-icon"><a href="#"><span>Menu</span></a></li>
        </ul>

        <section className="top-bar-section">
          <ul className="left">
            <NavDivider />
            <NavListItem link="app" text="Overview" />
            <NavDivider />
            <NavListItem link="rooms" text="Rooms" />
            <NavDivider />
            <NavListItem link="nodes" text="Nodes" />
            <NavDivider />
          </ul>

          <ul className="right">
            <NavDivider />
            <NavListItem link="notifications" icon="fi-info" text="0 Notifications" />
            <NavDivider />
            <NavListItem link="settings" icon="fi-widget" text="Settings" />
            <NavDivider />
            <NavListItem link="help" icon="fi-book" text="Help Center" />
            <NavDivider />
            <NavListItem link="logout" icon="fi-power" text="Log out" />
          </ul>
        </section>
      </nav>
    );
	}

});
