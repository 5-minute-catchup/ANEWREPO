var express = require('express')
var passport = require('passport')
var util = require('util')
var FacebookStrategy = require('passport-facebook').Strategy
var logger = require('morgan')
var session = require('express-session')
var sessionStore = require('sessionstore');
var bodyParser = require("body-parser")
var cookieParser = require("cookie-parser")
var methodOverride = require('method-override');
var port = process.env.PORT || 3000;
var markers = [];
var https = require('https');

// database set up
var mongojs = require("mongojs");
var mongoose = require('mongoose')
var uri = 'mongodb://fmcteam:fmc123@ds031802.mongolab.com:31802/fmcuser'
var db = mongoose.connect(uri)

var FACEBOOK_APP_ID = "653014024831372";
var FACEBOOK_APP_SECRET = "8f7186268d5d2f58856d95c657266f96";

var User = mongoose.model('User', {
  name: String,
  facebookID: String,
  image: String,
  friends: Array,
});
//database logic



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName'],
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {

    var friendObject;
    console.log(friendsSorter())


    function friendsSorter(){

      https.get("https://graph.facebook.com/" + profile.id + "/friends?" + "&access_token=" + accessToken, function(res) {
        var body = '';
        var array = []
        res.on('data', function(bit) {
          body += bit;
        });
        res.on('end', function(){
            var results = JSON.parse(body).data.map(function(friend){
              var friends = {};
              friends[friend.id] = friend.name; 
              return friends;
            })
            updateFriends(results)
          })
        }).on('error', function(err) {
          console.error(err);
        })
    };

    function updateFriends(friends) { 
      User.findOne({facebookID: profile.id}, function(err, user) {
        if(err) {
          done(err);
        }
        else if (!user) {
          user = new User({
            facebookID: profile.id,
              name: profile.displayName,
              provider: 'facebook',
              facebook: profile._json,
              image: "https://graph.facebook.com/" + profile.id + "/picture?width=200&height=200&access_token=" + accessToken,
              friends: friends
          });

          user.save(function(err) {
              if (err) console.log(err);
              done(err, user);
          });
        } else {
          done(err, user);
        }

      });
    }
  }
));


var app = express();

  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'ejs');
  // app.use(logger("combined"));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(methodOverride());
  var sessionObject = session({
      secret: "keyboard cat",
      saveUninitialized: true, // (default: true)
      resave: true, // (default: true)
    });
  app.use(sessionObject);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/app/public'));
  app.use(express.static(__dirname + '/'));

  var http    = require('http');
      server  = http.createServer(app);
      io      = require('socket.io')(server);


app.get('/', function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
  res.render('index', { user: user });
});
});

app.get('/account', ensureAuthenticated, function(req, res){
    User.findById(req.session.passport.user, function(err, user) {
   if(err) {
     console.log(err);
   } else {
     res.render('account', { user: user});
   }
  });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {

    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/chat', function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);
    } else {
     res.render('chat', { user: user});
    }  
  });
});


io.use(function(socket, next) {
  sessionObject(socket.request, socket.request.res, next);
});

// Socket markers start

io.on('connection', function(socket) {
    console.log('a user connected');

    socket.on('marker', function(data) {
      data.socketId = socket.id;
      User.findById(socket.request.session.passport.user, function(err, user){
        if(user){
          data.user = user;
          markers[socket.id] = data;
          console.log(data);
          io.emit('show-marker', data);
        }
      });
    });

    // socket.on('show-marker', )
    socket.on('show-user-location', function(data) {
      io.emit('show-user-location', data);
    });

});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('chat message', function(msg, data){
    data.socketId = socket.id;
    console.log('message:' + msg);
     io.emit('chat message', msg);
  });
});


server.listen(port, function(){
  console.log('five minute catch up is on port 3000');
});



// socket markers end

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

module.exports = server;