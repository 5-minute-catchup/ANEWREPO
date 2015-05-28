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
var chatUsers = {};

var FACEBOOK_APP_ID = "653014024831372";
var FACEBOOK_APP_SECRET = "8f7186268d5d2f58856d95c657266f96";

var User = mongoose.model('User', {
  name: String,
  facebookID: String,
  image: String,
  friends: Array,
});

var Chat = mongoose.model('Chat', {
  name: String,
  msg: String,
  created: {type: Date, default: Date.now}
});
//database logic

var connected_users_data = [];


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
              image: "https://graph.facebook.com/" + profile.id + "/picture?width=80&height=80&access_token=" + accessToken,
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

// app.get('/auth/facebook/callback', function(req, res) {
//   passport.authenticate('facebook', function(err, user) {
//     if (!user) {
//       return res.redirect('/login');
//     } else {

//       return res.redirect('/?name='+ user.name);
//       // return res.redirect('/');
//     }
//   })(req, res);
// });

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Chat start


app.get('/chat', function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);
    } else {
     res.render('chat', { user: user });
    }  
  });
});
/////

io.use(function(socket, next) {
  sessionObject(socket.request, socket.request.res, next);
});

// Socket markers start

io.on('connection', function(socket) {

    socket.on('marker', function(data) {
      data.socketId = socket.id;
      User.findById(socket.request.session.passport.user, function(err, user){
        if(user){
          data.socketId = socket.id;
          data.user = user;
          markers.push(data);
          console.log(markers);
          // markers[socket.id] = data;
          
          io.emit('show-marker', markers);
        }
      });
    });
    // socket.on('show-marker', )
    socket.on('show-user-location', function(data) {
      io.emit('show-user-location', data);
    });

  
  socket.on('disconnect', function(){
    markers = markers.filter(function(obj){
    return obj.socketId !== socket.id
  });
  });      


});

///CHAT

io.on('connection', function(socket){
  console.log('a user connected');

  // socket.on('user connected', function(data, callback) {
  //   if (data in users) {
  //     callback(false);
  //   } else{
  //     callback(true);
  //     socket.username = data;
  //     users[socket.username] = socket;
  //     updateUsernames();
  //   }
  // });

  // function updateUsernames() {
  //   io.emit('usernames', Object.keys(users));
  // }
  
  socket.on('send message', function(msg){
    console.log('message:' + msg);
     User.findById(socket.request.session.passport.user, function(err, user){
      var newMsg = new Chat({msg: msg, name: user.name});
      newMsg.save(function(err){
        if(err) throw err;
      });
     io.emit('send message', {msg: msg, name: user.name});
   });
  });

});
/////


server.listen(port, function(){
  console.log('five minute catch up is on port 3000');
});

// socket markers end

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

module.exports = server;