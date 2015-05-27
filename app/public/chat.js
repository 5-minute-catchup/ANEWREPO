var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var users = {};

http.listen(4000, function(){
  console.log('Listening on Port 4000');
});

mongoose.connect('mongodb://localhost/socketChat', function(err){
  if(err){
    console.log(err);
  } else{
    console.log('Connected to MongoDB'); 
  }
});

var chatSchema = mongoose.Schema({ 
  user: String,
  msg: String,
  created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});  

io.on('connection', function(socket){
  var query = Chat.find({}); 
    query.sort('-created').limit(8).exec(function(err, docs){
      if(err) throw err;
      socket.emit('load old msgs', docs);
  });

  socket.on('new user', function(data, callback) {
    if (data in users) {
      callback(false);
    } else{
      callback(true);
      socket.username = data;
      users[socket.username] = socket;
      updateUsernames();
    }
  });

  function updateUsernames() {
    io.emit('usernames', Object.keys(users));
  };

  socket.on('send message', function(data, callback){
    var msg = data.trim();
    if(msg.substr(0,3) === '/w '){ //whispers block
      msg = msg.substr(3);
      var ind = msg.indexOf(' ');
      if(ind !== -1){
        var name = msg.substring(0, ind);
        var msg = msg.substring(ind + 1);
        if(name in users){
          users[name].emit('private message', {msg: msg, user: socket.username});
          console.log('Whisper');
        } else{
          callback('Error, enter a valid user');
        }
      } else{
        callback('Error! Please enter whisper message')
      } 
    } else{
        var newMsg = new Chat({msg: msg, user: socket.username});
        newMsg.save(function(err){
          if(err) throw err;
        });
        io.emit('new message', {msg: msg, user: socket.username}); //actual messages
      }
  });

  socket.on('disconnect', function(data) {
    if(!socket.username) return;
    delete users[socket.username]
    updateUsernames();
  });
});
