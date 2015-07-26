var Footer = React.createClass({

  render: function() {
    return (
      <footer>
        <div className="row">
          <div className="large-6 medium-6 small-6 columns">
            <p className="left">© 2015 SMART HOME</p>
          </div>
          <div className="large-6 medium-6 small-6 columns">
            <ul className="inline-list right">
              <li><a href="/privacy">Privacy policy</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }

});
