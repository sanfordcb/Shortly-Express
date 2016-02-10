var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'qwe123qwe124dhgnsduihgsivhiiousdngd5vufgvsu',
  resave: false,
  saveUnitialized: true
}));


app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
// when clicking on shorten button or requesting a shortened link, reroute to login page
  //on login page, user can click sign up button and we'd route them to signup page
  //when user logs in, check password with listener from user model
  //after login, reroute to shorten page
  //trigger app.get('/create')

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  new User({username: username})
    .fetch()
    .then(function(user){
      if(!user){
        res.redirect('/login');
      }
      bcrypt.compare(req.body.password, user.get('password'), function(error, match){
        if(match){
          utils.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      })
    });

  // knex('users').select('username', 'password').then(function(rowUsername, rowPassword){
  //   var username = JSON.parse(req.body.json['username']);
  //   var password = JSON.parse(req.body.json['password']);
  //   if(rowUsername === username) {
  //     var hash = bcrypt.hashSync(password); 
  //     if(hash === rowPassword) {
  //       res.redirect('/create');
  //     } else {
  //       res.redirect('back');
  //     }
  //   } 
  // });
  // res.redirect('/signup');
});

app.get('/signup', function(req, res){
  res.render('signup');
});

app.post('/signup', function(req, res){
  this.trigger('creating', req.body);
  res.redirect('/login');
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
