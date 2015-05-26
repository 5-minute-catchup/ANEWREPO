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
var port = process.env.PORT || 3000
var markers = [];
// database set up
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var mongojs = require("mongojs");
var uri = 'mongodb://fmcteam:fmc123@ds031802.mongolab.com:31802/fmcuser'
var db = mongoose.connect(uri)

var User = mongoose.model('User', {
  name: String,
  facebookID: String
});
//database logic

/*add the instance of io here*/

var FACEBOOK_APP_ID = "653014024831372";
var FACEBOOK_APP_SECRET = "8f7186268d5d2f58856d95c657266f96";

passport.serializeUser(function(user, done) {
 console.log('serializeUser: ' + user.id)
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({
    _id: id
    }, function(err, user){
     if(!err) done(null, User);
     else done(err, null)
 })
});

var sessionData = session({
  store: sessionStore.createSessionStore(),
  secret: "your_secret",
  cookie: { maxAge: 2628000000 },
  resave: true,
  saveUninitialized: true
});

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback"
  },
    
    var newUser = new User({
      id: Number,
      name: { first: String, last: String },
      picture: { url: String }
    });
    newUser.save(function(err) {
      if(err) throw err;
    });

  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName'],
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile.id)
     User.findOne({
            facebookID: profile.id 
        }, function(err, user) {
            if(err) {
              return done(err);
            }
            else if (!user) {
                user = new User({
                  facebookID: profile.id,
                    name: profile.displayName,
                    provider: 'facebook',
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
              console.log("in else block")
                //found user. Return
                return done(err, user);
            }
        });
>>>>>>> c23750deaf3e1bdc967e4a8d1dc9a35cf7b053ea
  }
));


var app = express();

  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'ejs');
  app.use(sessionData);
  app.use(logger("combined"));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(methodOverride());
  app.use(session({
      secret: "keyboard cat",
      saveUninitialized: true, // (default: true)
      resave: true, // (default: true)
    }));
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

// app.get('/mapjs', function(req, res){
//   res.sendFile(__dirname + '/app/public/map.js');
// });

// Socket markers start

io.on('connection', function(socket) {
    console.log('a user connected');

    socket.on('marker', function(data) {
      data.socketId = socket.id;
      markers[socket.id] = data;
      console.log('marker latitude: ' + data.lat + ', marker longitude:' + data.lng);
      socket.broadcast.emit('show-marker', data);
    });

    // socket.on('show-marker', )
    socket.on('show-user-location', function(data) {
      socket.broadcast.emit('show-user-location', data);
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


// Session stuff

// var passport = require('passport');
// var passportStrategy = require('./utils/passport-strategy');
// var expressSession = require('express-session');
// var sessionStore = require('sessionstore');


// app.use(sessionData);

//   // Here's the trick, you attach your current session data to the socket using the client cookie as a convergence point.
// io.use(function(socket, next){
//   sessionData(socket.request, socket.request.res, next);
// });

// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(passportStrategy.facebook);


// // This part is quite tricky, 

// // This part is important, this is the function to get the id of the user in the databse based on the user object.
// passport.serializeUser(function(user, done) {
//   done(null, user.id);
// });


// // Here we get the user object based on the user id on the database.

// passport.deserializeUser(function(user, done) {
//   // this is an example because im using mongo in my original proyect, you need to replace this with something working on postgre to get the user from his ID and pass the complete user object to the "done" function.
//   Users.findById(user, function(err, User) {
//     done(err, User);
//   });
// });

module.exports = server;
